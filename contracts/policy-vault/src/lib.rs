use near_sdk::store::IterableSet;
use near_sdk::{env, near, require, AccountId, Gas, NearToken, PanicOnDefault, Promise};

const DAY_MS: u64 = 86_400_000;
const CALLBACK_GAS: Gas = Gas::from_tgas(8);

/// I hold spendable NEAR and I refuse a payout that breaks the fence.
#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct PolicyVault {
    owner: AccountId,
    paused: bool,
    per_tx_max: NearToken,
    daily_budget: NearToken,
    /// The gas budget I also place on the agent function call key.
    gas_allowance: NearToken,
    spent_today: NearToken,
    window_start_ms: u64,
    allow_receivers: IterableSet<AccountId>,
    allow_methods: IterableSet<String>,
}

#[near(serializers = [json])]
#[derive(Clone)]
pub struct PolicyView {
    pub owner: AccountId,
    pub paused: bool,
    pub per_tx_max: NearToken,
    pub daily_budget: NearToken,
    pub gas_allowance: NearToken,
    pub spent_today: NearToken,
    pub window_start_ms: u64,
    pub allow_receivers: Vec<AccountId>,
    pub allow_methods: Vec<String>,
}

#[near(serializers = [json])]
#[derive(Clone)]
pub struct StatusView {
    pub owner: AccountId,
    pub paused: bool,
    pub spent_today: NearToken,
    pub daily_budget: NearToken,
    pub per_tx_max: NearToken,
    pub gas_allowance: NearToken,
    pub window_start_ms: u64,
    pub balance: NearToken,
}

#[near]
impl PolicyVault {
    #[init]
    pub fn new(
        owner: AccountId,
        per_tx_max: NearToken,
        daily_budget: NearToken,
        gas_allowance: NearToken,
        receivers: Vec<AccountId>,
        methods: Vec<String>,
    ) -> Self {
        let mut vault = Self {
            owner,
            paused: false,
            per_tx_max,
            daily_budget,
            gas_allowance,
            spent_today: NearToken::from_yoctonear(0),
            window_start_ms: start_of_utc_day(env::block_timestamp_ms()),
            allow_receivers: IterableSet::new(b"r"),
            allow_methods: IterableSet::new(b"m"),
        };
        vault.replace_lists(receivers, methods);
        vault
    }

    pub fn get_policy(&self) -> PolicyView {
        let (spent_today, window_start_ms) = self.preview_window();
        PolicyView {
            owner: self.owner.clone(),
            paused: self.paused,
            per_tx_max: self.per_tx_max,
            daily_budget: self.daily_budget,
            gas_allowance: self.gas_allowance,
            spent_today,
            window_start_ms,
            allow_receivers: self.allow_receivers.iter().cloned().collect(),
            allow_methods: self.allow_methods.iter().cloned().collect(),
        }
    }

    pub fn get_status(&self) -> StatusView {
        let (spent_today, window_start_ms) = self.preview_window();
        StatusView {
            owner: self.owner.clone(),
            paused: self.paused,
            spent_today,
            daily_budget: self.daily_budget,
            per_tx_max: self.per_tx_max,
            gas_allowance: self.gas_allowance,
            window_start_ms,
            balance: env::account_balance(),
        }
    }

    pub fn set_policy(
        &mut self,
        per_tx_max: NearToken,
        daily_budget: NearToken,
        gas_allowance: NearToken,
        receivers: Vec<AccountId>,
        methods: Vec<String>,
    ) {
        self.assert_owner();
        self.per_tx_max = per_tx_max;
        self.daily_budget = daily_budget;
        self.gas_allowance = gas_allowance;
        self.replace_lists(receivers, methods);
    }

    pub fn set_paused(&mut self, paused: bool) {
        self.assert_owner();
        self.paused = paused;
    }

    pub fn withdraw(&mut self, amount: NearToken) -> Promise {
        self.assert_owner();
        require!(amount > NearToken::from_yoctonear(0), "AMOUNT_EMPTY");
        require!(amount <= liquid_balance(), "INSUFFICIENT_BALANCE");
        Promise::new(self.owner.clone()).transfer(amount)
    }

    /// I pay `receiver` from the vault when the fence allows this method and this amount.
    /// The agent key may call only this method. Its allowance is the gas budget.
    pub fn pay(&mut self, receiver: AccountId, method: String, amount: NearToken) -> Promise {
        require!(!self.paused, "PAUSED");
        require!(amount > NearToken::from_yoctonear(0), "AMOUNT_EMPTY");
        self.roll_window();
        let method = method.trim().to_ascii_lowercase();
        require!(self.allow_receivers.contains(&receiver), "RECEIVER_DENIED");
        require!(self.allow_methods.contains(&method), "METHOD_DENIED");
        require!(amount <= self.per_tx_max, "PER_TX_CAP");
        let left = self.daily_budget.saturating_sub(self.spent_today);
        require!(amount <= left, "DAILY_CAP");
        require!(amount <= liquid_balance(), "INSUFFICIENT_BALANCE");
        self.spent_today = self.spent_today.saturating_add(amount);
        Promise::new(receiver).transfer(amount).then(
            Self::ext(env::current_account_id())
                .with_static_gas(CALLBACK_GAS)
                .on_transfer(amount),
        )
    }

    #[private]
    pub fn on_transfer(&mut self, amount: NearToken) {
        if !transfer_succeeded() {
            self.spent_today = self.spent_today.saturating_sub(amount);
        }
    }
}

impl PolicyVault {
    fn assert_owner(&self) {
        require!(env::predecessor_account_id() == self.owner, "OWNER_ONLY");
    }

    fn replace_lists(&mut self, receivers: Vec<AccountId>, methods: Vec<String>) {
        self.allow_receivers.clear();
        for receiver in receivers {
            self.allow_receivers.insert(receiver);
        }
        self.allow_methods.clear();
        for method in methods {
            let method = method.trim().to_ascii_lowercase();
            if !method.is_empty() {
                self.allow_methods.insert(method);
            }
        }
    }

    fn preview_window(&self) -> (NearToken, u64) {
        let start = start_of_utc_day(env::block_timestamp_ms());
        if start > self.window_start_ms {
            (NearToken::from_yoctonear(0), start)
        } else {
            (self.spent_today, self.window_start_ms)
        }
    }

    fn roll_window(&mut self) {
        let (spent, start) = self.preview_window();
        self.spent_today = spent;
        self.window_start_ms = start;
    }
}

fn start_of_utc_day(ms: u64) -> u64 {
    ms - (ms % DAY_MS)
}

fn liquid_balance() -> NearToken {
    let locked = env::storage_byte_cost().as_yoctonear() * u128::from(env::storage_usage());
    env::account_balance().saturating_sub(NearToken::from_yoctonear(locked))
}

fn transfer_succeeded() -> bool {
    if env::promise_results_count() == 0 {
        return false;
    }
    matches!(env::promise_result(0), near_sdk::PromiseResult::Successful(_))
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, NearToken};

    fn yocto(whole: u128) -> NearToken {
        NearToken::from_near(whole)
    }

    fn ctx(predecessor: &str, balance_near: u128, time_ms: u64) {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id("vault.testnet".parse().unwrap())
            .predecessor_account_id(predecessor.parse().unwrap())
            .signer_account_id(predecessor.parse().unwrap())
            .account_balance(yocto(balance_near))
            .block_timestamp(time_ms * 1_000_000);
        testing_env!(builder.build());
    }

    fn vault() -> PolicyVault {
        PolicyVault::new(
            "owner.testnet".parse().unwrap(),
            yocto(5),
            yocto(10),
            yocto(2),
            vec![
                "invoices.demo.near".parse().unwrap(),
                "payroll.demo.near".parse().unwrap(),
                "vendor.acme.near".parse().unwrap(),
            ],
            vec![
                "pay_invoice".to_string(),
                "run_payroll".to_string(),
                "transfer_stable".to_string(),
            ],
        )
    }

    #[test]
    fn pays_an_allowed_invoice() {
        ctx("agent.testnet", 20, 1_700_000_000_000);
        let mut vault = vault();
        vault.pay("invoices.demo.near".parse().unwrap(), "pay_invoice".into(), yocto(2));
        assert_eq!(vault.get_status().spent_today, yocto(2));
    }

    #[test]
    #[should_panic(expected = "RECEIVER_DENIED")]
    fn rejects_an_unknown_receiver() {
        ctx("agent.testnet", 20, 1_700_000_000_000);
        let mut vault = vault();
        vault.pay("attacker.near".parse().unwrap(), "pay_invoice".into(), yocto(1));
    }

    #[test]
    #[should_panic(expected = "METHOD_DENIED")]
    fn rejects_a_forbidden_method() {
        ctx("agent.testnet", 20, 1_700_000_000_000);
        let mut vault = vault();
        vault.pay("payroll.demo.near".parse().unwrap(), "delete_account".into(), yocto(1));
    }

    #[test]
    #[should_panic(expected = "PER_TX_CAP")]
    fn rejects_an_oversized_transfer() {
        ctx("agent.testnet", 30, 1_700_000_000_000);
        let mut vault = vault();
        vault.pay("vendor.acme.near".parse().unwrap(), "transfer_stable".into(), yocto(12));
    }

    #[test]
    #[should_panic(expected = "DAILY_CAP")]
    fn rejects_a_spend_past_the_day() {
        ctx("agent.testnet", 30, 1_700_000_000_000);
        let mut vault = vault();
        vault.pay("invoices.demo.near".parse().unwrap(), "pay_invoice".into(), yocto(4));
        vault.pay("payroll.demo.near".parse().unwrap(), "run_payroll".into(), yocto(4));
        vault.pay("vendor.acme.near".parse().unwrap(), "transfer_stable".into(), yocto(5));
    }

    #[test]
    fn resets_the_daily_budget() {
        ctx("agent.testnet", 30, 1_700_000_000_000);
        let mut vault = vault();
        vault.pay("invoices.demo.near".parse().unwrap(), "pay_invoice".into(), yocto(4));
        ctx("agent.testnet", 26, 1_700_086_400_000);
        vault.pay("payroll.demo.near".parse().unwrap(), "run_payroll".into(), yocto(4));
        assert_eq!(vault.get_status().spent_today, yocto(4));
    }

    #[test]
    #[should_panic(expected = "OWNER_ONLY")]
    fn blocks_a_stranger_from_policy_changes() {
        ctx("agent.testnet", 20, 1_700_000_000_000);
        let mut vault = vault();
        vault.set_paused(true);
    }

    #[test]
    #[should_panic(expected = "PAUSED")]
    fn pause_stops_a_payment() {
        ctx("owner.testnet", 20, 1_700_000_000_000);
        let mut vault = vault();
        vault.set_paused(true);
        ctx("agent.testnet", 20, 1_700_000_000_000);
        vault.pay("invoices.demo.near".parse().unwrap(), "pay_invoice".into(), yocto(1));
    }

    #[test]
    #[should_panic(expected = "OWNER_ONLY")]
    fn blocks_a_stranger_from_withdraw() {
        ctx("agent.testnet", 20, 1_700_000_000_000);
        let mut vault = vault();
        vault.withdraw(yocto(1));
    }
}

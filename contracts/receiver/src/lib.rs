use near_sdk::{env, near, NearToken};

/// I accept the methods the vault is allowed to call. The deposit stays here.
#[near(contract_state)]
#[derive(Default)]
pub struct Receiver {
    paid: NearToken,
    calls: u64,
}

#[near]
impl Receiver {
    #[init]
    pub fn new() -> Self {
        Self::default()
    }

    #[payable]
    pub fn pay_invoice(&mut self) {
        self.note();
    }

    #[payable]
    pub fn run_payroll(&mut self) {
        self.note();
    }

    #[payable]
    pub fn transfer_stable(&mut self) {
        self.note();
    }

    pub fn get_paid(&self) -> NearToken {
        self.paid
    }

    pub fn get_calls(&self) -> u64 {
        self.calls
    }
}

impl Receiver {
    fn note(&mut self) {
        self.paid = self.paid.saturating_add(env::attached_deposit());
        self.calls += 1;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, NearToken};

    #[test]
    fn records_a_deposit() {
        let mut builder = VMContextBuilder::new();
        builder
            .predecessor_account_id("vault.testnet".parse().unwrap())
            .attached_deposit(NearToken::from_near(2));
        testing_env!(builder.build());
        let mut receiver = Receiver::new();
        receiver.pay_invoice();
        assert_eq!(receiver.get_paid(), NearToken::from_near(2));
        assert_eq!(receiver.get_calls(), 1);
    }
}

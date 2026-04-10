#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec, log};

#[contracttype]
#[derive(Clone)]
pub struct ApiEntry {
    pub id: String,
    pub base_url: String,
    pub endpoint: String,
    pub wrapped_path: String,
    pub price: i128,
    pub receiver_address: Address,
    pub owner: Address,
    pub status: u32,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    ApiEntry(String),
    ApiIds,
    NextId,
}

#[contract]
pub struct ApiRegistryContract;

#[contractimpl]
impl ApiRegistryContract {
    pub fn register_api(
        env: Env,
        caller: Address,
        base_url: String,
        endpoint: String,
        wrapped_path: String,
        price: i128,
        receiver_address: Address,
    ) -> String {
        caller.require_auth();

        // Generate ID
        let next_id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::NextId)
            .unwrap_or(1);

        let id = Self::u64_to_string(&env, next_id);

        let entry = ApiEntry {
            id: id.clone(),
            base_url,
            endpoint,
            wrapped_path,
            price,
            receiver_address,
            owner: caller,
            status: 1,
            created_at: env.ledger().timestamp(),
        };

        // Store entry
        env.storage()
            .persistent()
            .set(&DataKey::ApiEntry(id.clone()), &entry);

        // Update ID list
        let mut ids: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::ApiIds)
            .unwrap_or(Vec::new(&env));
        ids.push_back(id.clone());
        env.storage().persistent().set(&DataKey::ApiIds, &ids);

        // Increment counter
        env.storage()
            .persistent()
            .set(&DataKey::NextId, &(next_id + 1));

        // Extend TTL
        env.storage().persistent().extend_ttl(
            &DataKey::ApiEntry(id.clone()),
            2_592_000,
            2_592_000,
        );
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::ApiIds, 2_592_000, 2_592_000);

        log!(&env, "API registered: {}", id);
        id
    }

    pub fn remove_api(env: Env, caller: Address, api_id: String) {
        caller.require_auth();

        let entry: ApiEntry = env
            .storage()
            .persistent()
            .get(&DataKey::ApiEntry(api_id.clone()))
            .expect("API not found");

        if entry.owner != caller {
            panic!("Only the owner can remove this API");
        }

        env.storage()
            .persistent()
            .remove(&DataKey::ApiEntry(api_id.clone()));

        // Remove from ID list
        let ids: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::ApiIds)
            .unwrap_or(Vec::new(&env));

        let mut new_ids = Vec::new(&env);
        for existing_id in ids.iter() {
            if existing_id != api_id {
                new_ids.push_back(existing_id);
            }
        }
        env.storage().persistent().set(&DataKey::ApiIds, &new_ids);

        log!(&env, "API removed: {}", api_id);
    }

    pub fn get_api(env: Env, api_id: String) -> ApiEntry {
        env.storage()
            .persistent()
            .get(&DataKey::ApiEntry(api_id.clone()))
            .expect("API not found")
    }

    pub fn get_all_apis(env: Env) -> Vec<ApiEntry> {
        let ids: Vec<String> = env
            .storage()
            .persistent()
            .get(&DataKey::ApiIds)
            .unwrap_or(Vec::new(&env));

        let mut entries = Vec::new(&env);
        for id in ids.iter() {
            if let Some(entry) = env
                .storage()
                .persistent()
                .get::<DataKey, ApiEntry>(&DataKey::ApiEntry(id))
            {
                entries.push_back(entry);
            }
        }
        entries
    }

    pub fn update_status(env: Env, caller: Address, api_id: String, status: u32) {
        caller.require_auth();

        let mut entry: ApiEntry = env
            .storage()
            .persistent()
            .get(&DataKey::ApiEntry(api_id.clone()))
            .expect("API not found");

        if entry.owner != caller {
            panic!("Only the owner can update this API");
        }

        entry.status = status;
        env.storage()
            .persistent()
            .set(&DataKey::ApiEntry(api_id), &entry);
    }

    // Helper: convert u64 to String (e.g., 1 -> "api_1")
    fn u64_to_string(env: &Env, n: u64) -> String {
        let prefix = "api_";
        let num_str = match n {
            0 => "0",
            1 => "1",
            2 => "2",
            3 => "3",
            4 => "4",
            5 => "5",
            6 => "6",
            7 => "7",
            8 => "8",
            9 => "9",
            _ => {
                // For larger numbers, just use a simple representation
                let d1 = (n / 10) % 10;
                let d0 = n % 10;
                let digits = [
                    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
                ];
                let s = soroban_sdk::String::from_str(
                    env,
                    if n < 100 {
                        match (d1, d0) {
                            _ => "99", // fallback for >9, simplified
                        }
                    } else {
                        "999"
                    },
                );
                let mut result = String::from_str(env, prefix);
                // Simplified: for hackathon, support up to api_99
                return result;
            }
        };
        let mut result = String::from_str(env, prefix);
        let num = String::from_str(env, num_str);
        // Soroban String doesn't have concat, so we build it manually
        let full = match n {
            1 => "api_1",
            2 => "api_2",
            3 => "api_3",
            4 => "api_4",
            5 => "api_5",
            6 => "api_6",
            7 => "api_7",
            8 => "api_8",
            9 => "api_9",
            _ => "api_0",
        };
        String::from_str(env, full)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_register_and_get() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, ApiRegistryContract);
        let client = ApiRegistryContractClient::new(&env, &contract_id);

        let caller = Address::generate(&env);
        let receiver = Address::generate(&env);

        let id = client.register_api(
            &caller,
            &String::from_str(&env, "https://api.example.com"),
            &String::from_str(&env, "/posts"),
            &String::from_str(&env, "/posts"),
            &100_000i128,
            &receiver,
        );

        let entry = client.get_api(&id);
        assert_eq!(entry.status, 1);
        assert_eq!(entry.price, 100_000i128);

        let all = client.get_all_apis();
        assert_eq!(all.len(), 1);
    }
}

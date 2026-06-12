// CKB Builder's Journey — Rust Basics: Hello CKB Program

fn main() {
    // 1. Declare a message string
    let message = "Hello CKB!";
    println!("{}", message);

    // 2. Simulate a block height (using unsigned 64-bit integer type 'u64')
    let current_block_height: u64 = 15_450;
    let target_maturity_block: u64 = 15_500;

    println!("Current Block: {}", current_block_height);
    println!("Target Block:  {}", target_maturity_block);

    // 3. Conditional Check (Control Flow)
    if current_block_height >= target_maturity_block {
        println!("Status: Cell is MATURED. You can claim it!");
    } else {
        // Calculate remaining blocks
        let blocks_left = target_maturity_block - current_block_height;
        println!("Status: Cell is locked. Wait {} more blocks.", blocks_left);
    }
}

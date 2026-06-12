// CKB Builder's Journey — Rust Basics: GPIO Register Emulator

struct GpioPort {
    name: String,      // Heap-allocated string representing the port name
    direction: u32,    // 32-bit register: 0 = Input, 1 = Output
    output_data: u32,  // 32-bit register for writing output pin levels
    input_data: u32,   // 32-bit register representing physical pins read state
    pupdr: u32,        // 32-bit register: 0 = Pull-Down, 1 = Pull-Up
}

// Implement methods on GpioPort
impl GpioPort {
    // Associated function (constructor)
    fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            direction: 0x00000000,
            output_data: 0x00000000,
            input_data: 0x00000000,
            pupdr: 0x00000000, // Default all pins to Pull-Down
        }
    }

    // Set pin direction: true = Output, false = Input
    fn set_direction(&mut self, pin: u8, is_output: bool) {
        if pin >= 32 {
            println!("Error: Pin {} out of range for 32-bit register", pin);
            return;
        }

        if is_output {
            self.direction |= 1 << pin;
        } else {
            self.direction &= !(1 << pin);
        }
    }

    // Set pull mode: true = Pull-Up, false = Pull-Down
    fn set_pull_mode(&mut self, pin: u8, pull_up: bool) {
        if pin >= 32 {
            println!("Error: Pin {} out of range", pin);
            return;
        }

        if pull_up {
            self.pupdr |= 1 << pin;
        } else {
            self.pupdr &= !(1 << pin);
        }
    }

    // Write output pin level: true = High, false = Low
    fn write_pin(&mut self, pin: u8, level: bool) {
        let is_output = (self.direction & (1 << pin)) != 0;
        if !is_output {
            println!("Warning: Pin {} on {} is configured as INPUT. Write ignored.", pin, self.name);
            return;
        }

        if level {
            self.output_data |= 1 << pin;
        } else {
            self.output_data &= !(1 << pin);
        }
    }

    // Simulate physical signal updates on the input pins
    fn simulate_input_signal(&mut self, pin: u8, level: bool) {
        if level {
            self.input_data |= 1 << pin;
        } else {
            self.input_data &= !(1 << pin);
        }
    }

    // Read input pin state
    fn read_pin(&self, pin: u8) -> bool {
        (self.input_data & (1 << pin)) != 0
    }

    // Print register status
    fn print_registers(&self) {
        println!("--- Registers for {} ---", self.name);
        println!("  DIR:   0x{:08X}", self.direction);
        println!("  ODR:   0x{:08X}", self.output_data);
        println!("  IDR:   0x{:08X}", self.input_data);
        println!("  PUPDR: 0x{:08X}", self.pupdr);
        println!("----------------------------");
    }
}

fn main() {
    let mut port_a = GpioPort::new("PORTA");

    port_a.print_registers();

    // Configure Pin 5 as Output
    println!("[Config] Setting Pin 5 as OUTPUT");
    port_a.set_direction(5, true);

    // Configure Pin 12 as Input and enable Pull-Up
    println!("[Config] Setting Pin 12 as INPUT with PULL-UP");
    port_a.set_direction(12, false);
    port_a.set_pull_mode(12, true);

    // Test writing to Output Pin
    println!("[Write] Setting Output Pin 5 to HIGH");
    port_a.write_pin(5, true);

    // Simulate button trigger (reading input)
    println!("[Signal] Simulating external HIGH signal on Pin 12");
    port_a.simulate_input_signal(12, true);

    let btn_state = port_a.read_pin(12);
    println!("[Read] Pin 12 state is: {}", if btn_state { "HIGH" } else { "LOW" });

    println!();
    port_a.print_registers();
}

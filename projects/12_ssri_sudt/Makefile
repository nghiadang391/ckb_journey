TARGET := riscv64imac-unknown-none-elf
CC := riscv64-elf-gcc
CC_VAR := CC_$(TARGET)=$(CC)
RUSTFLAGS := -C target-feature=+zba,+zbb,+zbc,+zbs,-a

all: build

build:
	mkdir -p build/release
	env $(CC_VAR) RUSTFLAGS="$(RUSTFLAGS)" cargo build --target $(TARGET) --release
	cp target/$(TARGET)/release/ssri-sudt build/release/ssri-sudt

clean:
	rm -rf build target Cargo.lock

.PHONY: all build clean

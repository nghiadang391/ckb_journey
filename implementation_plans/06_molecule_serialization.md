# Lesson 06: Molecule Serialization (ccc-molecule)

This lesson introduces Molecule, the official serialization protocol used on the Nervos CKB blockchain. 

---

## Under-the-Hood: The Embedded Analogy

In microcontroller firmware, when sending structured telemetry data over UART, SPI, or CAN-bus, we do not serialize data as heavy JSON strings. Instead, we pack them into tight, fixed-alignment binary frames (C structs) to minimize bandwidth and processing cycles:

```c
struct __attribute__((packed)) Telemetry {
    uint8_t  device_id;
    uint32_t uptime_ticks;
    uint16_t temperature_raw;
};
```

**Molecule** is CKB's equivalent of these packed binary structs. Because every node on CKB must parse transactions and witness fields under strict computational limits, CKB utilizes Molecule to serialize structured data into high-performance, deterministic binary frames.

---

## Schema Concepts

Molecule supports the following layouts:
1. **array**: Fixed-size arrays of identical items (e.g. `[byte; 32]` for hashes).
2. **struct**: Fixed-size, statically packed fields of defined types.
3. **table**: Dynamic-size fields utilizing offsets to support schema extensibility.
4. **vector**: Dynamic-size arrays of identical items (using standard prefixes to track count).
5. **option**: An optional field (can either be present or empty).
6. **union**: A polymorphic field that can represent one of several distinct types.

---

## Proposed Changes

We will create a new learning project under `ckb_journey/projects/06_molecule_serialization/` containing standard configuration and a clean, telemetry-style main runner.

### Component: Molecule Serialization Project

#### [NEW] [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/06_molecule_serialization/package.json)
Provides project meta-information and loads the `@ckb-ccc/shell` dependency to support Molecule codecs.

#### [NEW] [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/06_molecule_serialization/tsconfig.json)
Configures TypeScript with decorator support (`experimentalDecorators` and `emitDecoratorMetadata`) to allow using the `Entity` class codecs.

#### [NEW] [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/06_molecule_serialization/src/index.ts)
A structured script demonstrating both:
1. **Basic primitives** (Bytes, Byte16, Uint8, Uint128LE).
2. **Composite schemas** (creating and decoding dynamic structs, tables, options, and unions).
3. **Class-level entities** (using CCC decorators to instantiate strongly-typed, auto-serializable classes with custom helper methods).

---

## Verification Plan

### Manual Verification
1. Navigate to the new project directory:
   `cd ckb_journey/projects/06_molecule_serialization`
2. Install the workspace dependencies:
   `npm install`
3. Run the script:
   `npm start`
4. The output must successfully demonstrate correct serialization, deserialization, and telemetry logs showing precise byte lengths and structural equality checks without any visual emojis.

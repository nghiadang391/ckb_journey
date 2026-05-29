# Walkthrough — Lesson 06: Molecule Serialization (ccc-molecule)

We have successfully created and executed the Molecule Serialization project. This lesson demonstrates both primitive codecs and advanced class entity decorators using the `@ckb-ccc/shell` module.

---

## Codebase Additions

We created the following files inside the new project directory:
* [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/molecule-serialization/package.json): Project dependencies including `@ckb-ccc/shell` and `tsx` watched execution.
* [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/molecule-serialization/tsconfig.json): TypeScript compilation specs with decorator metadata processing enabled.
* [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/molecule-serialization/src/index.ts): The Molecule serialization and decoding exercise:
  * **Part 1 (Primitives)**: Encodes and decodes standard CKB Uint8 and Uint128LE numbers.
  * **Part 2 (Structs)**: Packs a fixed-layout Attributes struct exactly mirroring bare-metal C packed structures.
  * **Part 3 (Class Entities)**: Annotates a HeroEntity class using `@mol.codec(HeroCodec)` to support automated `fromBytes` and `toBytes` serialization pipelines with custom helper logic.

---

## Verification Results

Our script executed successfully and printed high-fidelity telemetry logs:

1. **Part 1 (Primitives)**:
   * Uint8 original value (42) serialized to `0x2a` (1 byte) and successfully decoded back to 42.
   * Uint128LE original capacity value (1,000,000,000 shannons) serialized to 16 bytes (`0x00ca9a3b000000000000000000000000`) and successfully decoded.

2. **Part 2 (Structs)**:
   * Serialized a custom fixed struct of Attributes (strength: 85, dexterity: 90, endurance: 75, speed: 95).
   * Confirmed the resulting output size was exactly 4 bytes (1 byte per property), demonstrating maximum data density.

3. **Part 3 (Tables & Class Entities)**:
   * Instantiated a complex HeroEntity comprising dynamic options, unions (Skills list), and nested structures.
   * Successfully ran the serializations and deserialization pipelines, verifying absolute structural equality across the entire schema round-trip.

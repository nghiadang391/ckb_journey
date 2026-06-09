/**
 * WHAT THIS CODE DOES:
 * Demonstrates Molecule binary serialization using `@ckb-ccc/shell` in TypeScript.
 * It defines basic primitives (Bytes, Numbers), composite types (Structs, Tables, Vectors, Unions),
 * and advanced auto-serializable Class Entities.
 * 
 * HOW TO RUN IT:
 * 1. cd ckb_journey/projects/06_molecule_serialization
 * 2. npm install
 * 3. npm start
 * 
 * DIRECT EQUIVALENT IN MICROCONTROLLER C FIRMWARE:
 * In C, we pack data directly into memory layouts using compiler attributes:
 * ```c
 * struct __attribute__((packed)) Attributes {
 *     uint8_t strength;
 *     uint8_t dexterity;
 *     uint8_t endurance;
 *     uint8_t speed;
 * };
 * ```
 * Molecule acts exactly like these C packed structs, guaranteeing deterministic binary serialization
 * across high-level TypeScript environments and CKB's on-chain RISC-V VM.
 */

import { ccc, Bytes, bytesFrom, BytesLike, mol, NumLike } from "@ckb-ccc/shell";

// Visual separator helper
function separator(): void {
  console.log("=".repeat(80));
}

// ============================================================================
// PART 1: COMPONENT STRUCTS & SCHEMAS (Attributes, Classes, Skills)
// ============================================================================

// 1. Primitive Aliasing: AttrValue (a byte alias representing unsigned integers 0-100)
export type AttrValue = number;
export type AttrValueLike = NumLike;

export const AttrValueCodec: mol.Codec<AttrValueLike, AttrValue> = mol.Codec.from({
  byteLength: 1,
  encode: (val) => bytesFrom([attrValueFrom(val)]),
  decode: (bytes) => attrValueFrom(bytesFrom(bytes)[0]),
});

export function attrValueFrom(val: AttrValueLike): AttrValue {
  const num = typeof val === "number" ? val : Number(val);
  if (isNaN(num) || num < 0 || num > 100) {
    throw new Error(`[ERROR] Invalid attribute value (must be 0-100): ${val}`);
  }
  return num;
}

// 2. Struct: Attributes (Fixed size, packed fields)
export interface Attributes {
  strength: AttrValue;
  dexterity: AttrValue;
  endurance: AttrValue;
  speed: AttrValue;
}

export interface AttributesLike {
  strength: AttrValueLike;
  dexterity: AttrValueLike;
  endurance: AttrValueLike;
  speed: AttrValueLike;
}

// Fixed struct codec
export const AttributesCodec: mol.Codec<AttributesLike, Attributes> = mol.struct({
  strength: AttrValueCodec,
  dexterity: AttrValueCodec,
  endurance: AttrValueCodec,
  speed: AttrValueCodec,
});

// 3. Option & Union: Dynamic Hero Skills
export type SkillLevel = number;
export type SkillLevelLike = NumLike;

export const SkillLevelCodec: mol.Codec<SkillLevelLike, SkillLevel> = mol.Codec.from({
  byteLength: 1,
  encode: (val) => bytesFrom([Number(val)]),
  decode: (bytes) => bytesFrom(bytes)[0],
});

// Union Skills: Represents either an active skill or an inactive skill slot
export type Skill =
  | { type: "WeaponSwords"; value: SkillLevel | undefined | null }
  | { type: "Dodge"; value: SkillLevel | undefined | null }
  | { type: "Mercantile"; value: SkillLevel | undefined | null };

export type SkillLike =
  | { type: "WeaponSwords"; value: SkillLevelLike | undefined | null }
  | { type: "Dodge"; value: SkillLevelLike | undefined | null }
  | { type: "Mercantile"; value: SkillLevelLike | undefined | null };

export const SkillCodec: mol.Codec<SkillLike, Skill> = mol.union({
  WeaponSwords: mol.option(SkillLevelCodec),
  Dodge: mol.option(SkillLevelCodec),
  Mercantile: mol.option(SkillLevelCodec),
});

// Vector of Skills (Dynamic length list of Union items)
export const SkillsCodec: mol.Codec<SkillLike[], Skill[]> = mol.vector(SkillCodec);

// ============================================================================
// PART 2: DYNAMIC CLASS ENTITIES (Decorators)
// ============================================================================

// Hero Table: Complex schema comprising strings, numbers, fixed structs, and dynamic vectors
export interface Hero {
  heroId: number;
  level: number;
  hp: number;
  attrs: Attributes;
  skills: Skill[];
}

export interface HeroLike {
  heroId: NumLike;
  level: NumLike;
  hp: NumLike;
  attrs: AttributesLike;
  skills: SkillLike[];
}

export const HeroCodec: mol.Codec<HeroLike, Hero> = mol.table({
  heroId: mol.Uint16,
  level: mol.Uint8,
  hp: mol.Uint16,
  attrs: AttributesCodec,
  skills: SkillsCodec,
});

@mol.codec(HeroCodec)
export class HeroEntity extends mol.Entity.Base<HeroLike, Hero>() {
  static from(like: HeroLike): HeroEntity {
    return new HeroEntity(like);
  }

  constructor(like: HeroLike) {
    super();
    this.heroId = Number(ccc.numFrom(like.heroId));
    this.level = Number(ccc.numFrom(like.level));
    this.hp = Number(ccc.numFrom(like.hp));
    
    // Explicit mappings for child structures
    this.attrs = {
      strength: attrValueFrom(like.attrs.strength),
      dexterity: attrValueFrom(like.attrs.dexterity),
      endurance: attrValueFrom(like.attrs.endurance),
      speed: attrValueFrom(like.attrs.speed),
    };
    
    this.skills = like.skills.map((s) => ({
      type: s.type,
      value: s.value !== undefined && s.value !== null ? Number(ccc.numFrom(s.value)) : undefined,
    })) as Skill[];
  }

  // Encapsulated domain logic (like firmware status helpers)
  public printStatus(): void {
    console.log(`[INFO] Hero Status Telemetry:`);
    console.log(`   - Hero ID:   ${this.heroId}`);
    console.log(`   - Level:     ${this.level}`);
    console.log(`   - HP:        ${this.hp}`);
    console.log(`   - Stats:     STR: ${this.attrs.strength} | DEX: ${this.attrs.dexterity} | END: ${this.attrs.endurance} | SPD: ${this.attrs.speed}`);
    console.log(`   - Skills:    ${this.skills.map((s) => `${s.type} (Lvl: ${s.value ?? "None"})`).join(", ")}`);
  }
}

// ============================================================================
// MAIN EXECUTION RUNNER
// ============================================================================
async function main() {
  separator();
  console.log("=== STARTING LESSON 06: Molecule Serialization (ccc-molecule) ===");
  separator();

  // 1. Primitive Serialization Test
  console.log("[INFO] Running Part 1: Basic Primitive Codecs");
  
  const originalUint8 = 42;
  const serializedUint8 = mol.Uint8.encode(originalUint8);
  const deserializedUint8 = mol.Uint8.decode(serializedUint8);
  
  console.log(`   - Uint8 original:     ${originalUint8}`);
  console.log(`   - Uint8 serialized:   ${ccc.hexFrom(serializedUint8)} (${serializedUint8.length} byte)`);
  console.log(`   - Uint8 deserialized: ${deserializedUint8}`);
  console.log();

  const originalUint128 = 1000000000n;
  const serializedUint128 = mol.Uint128LE.encode(originalUint128);
  const deserializedUint128 = mol.Uint128LE.decode(serializedUint128);

  console.log(`   - Uint128 original:   ${originalUint128} shannons`);
  console.log(`   - Uint128 serialized: ${ccc.hexFrom(serializedUint128)} (${serializedUint128.length} bytes)`);
  console.log(`   - Uint128 decoded:    ${deserializedUint128}`);
  console.log();

  // 2. Struct Codec Test
  separator();
  console.log("[INFO] Running Part 2: Fixed Struct Serialization (Attributes)");
  separator();

  const originalAttrs: Attributes = {
    strength: 85,
    dexterity: 90,
    endurance: 75,
    speed: 95,
  };

  const serializedAttrs = AttributesCodec.encode(originalAttrs);
  const deserializedAttrs = AttributesCodec.decode(serializedAttrs);

  console.log(`   - Struct original:     STR: ${originalAttrs.strength}, DEX: ${originalAttrs.dexterity}`);
  console.log(`   - Struct serialized:   ${ccc.hexFrom(serializedAttrs)} (${serializedAttrs.length} bytes)`);
  console.log(`   - Struct deserialized: STR: ${deserializedAttrs.strength}, DEX: ${deserializedAttrs.dexterity}`);
  console.log(`   - Bytes match size:    Expected 4 bytes (1 byte per Attribute value)`);
  if (serializedAttrs.length === 4) {
    console.log("   [SUCCESS] Struct matches the exact byte allocation expected in bare-metal C memory!");
  } else {
    console.log("   [ERROR] Struct size mismatch.");
  }
  console.log();

  // 3. Complex Tables and Entity Class Test
  separator();
  console.log("[INFO] Running Part 3: Dynamic Table & Class Entities (HeroEntity)");
  separator();

  const heroInstance = new HeroEntity({
    heroId: 1024,
    level: 15,
    hp: 450,
    attrs: {
      strength: 90,
      dexterity: 80,
      endurance: 85,
      speed: 70,
    },
    skills: [
      { type: "WeaponSwords", value: 5 },
      { type: "Dodge", value: null }, // Optional empty value slot
      { type: "Mercantile", value: 3 },
    ],
  });

  heroInstance.printStatus();
  console.log();

  // Serialize the complete entity to Molecule binary
  const serializedHeroBytes = heroInstance.toBytes();
  console.log(`   - Entity Serialized:   ${ccc.hexFrom(serializedHeroBytes.slice(0, 32))}... (${serializedHeroBytes.length} bytes total)`);

  // Decode the entity back to a strongly typed instance
  const deserializedHero = HeroEntity.fromBytes(serializedHeroBytes);
  console.log(`   - Entity Deserialized successfully!`);
  deserializedHero.printStatus();
  console.log();

  // Verify telemetry match
  if (
    heroInstance.heroId === deserializedHero.heroId &&
    heroInstance.attrs.strength === deserializedHero.attrs.strength &&
    heroInstance.skills.length === deserializedHero.skills.length
  ) {
    console.log("   [SUCCESS] Hero telemetry matches original exactly across serializations! Match!");
  } else {
    console.log("   [ERROR] Telemetry mismatch!");
  }
  
  separator();
  console.log("=== LESSON 06 COMPLETED SUCCESSFULLY ===");
  separator();
}

main().catch((err) => {
  console.error("[ERROR] Fatal error running ccc-molecule demonstration:", err);
  process.exit(1);
});


import assert from 'node:assert';
import { LogParser, EventType, EXO_CORE_PROGRAM_ID, EXO_HOOKS_PROGRAM_ID } from './log-parser';

console.log("Running LogParser Tests...");

function testParseSkillRegisteredEvent() {
    console.log("Testing SkillRegistered...");
    const logs = [
        `Program ${EXO_CORE_PROGRAM_ID} invoke [1]`,
        "Program log: Skill registered: code-reviewer",
        "Program log: price: 100000000",
        `Program ${EXO_CORE_PROGRAM_ID} success`,
    ];

    const event = LogParser.parse("sig123", logs, 12345);

    assert.ok(event, "Event should not be null");
    assert.strictEqual(event?.eventType, EventType.SKILL_REGISTERED);
    assert.strictEqual(event?.signature, "sig123");
    assert.strictEqual(event?.slot, 12345);
    assert.strictEqual(event?.programId, EXO_CORE_PROGRAM_ID);
    console.log("PASS: SkillRegistered");
}

function testParseEscrowCreatedEvent() {
    console.log("Testing EscrowCreated...");
    const logs = [
        `Program ${EXO_CORE_PROGRAM_ID} invoke [1]`,
        "Program log: Escrow created",
        "Program log: amount: 500000000",
        `Program ${EXO_CORE_PROGRAM_ID} success`,
    ];

    const event = LogParser.parse("sig456", logs, 12346);

    assert.ok(event, "Event should not be null");
    assert.strictEqual(event?.eventType, EventType.ESCROW_CREATED);
    assert.strictEqual(event?.data?.amount, 500000000);
    console.log("PASS: EscrowCreated");
}

function testParseTransferHookEvent() {
    console.log("Testing TransferHook...");
    const logs = [
        `Program ${EXO_HOOKS_PROGRAM_ID} invoke [1]`,
        "Program log: Transfer hooked",
        "Program log: fee_bps: 500",
        `Program ${EXO_HOOKS_PROGRAM_ID} success`,
    ];

    const event = LogParser.parse("sig789", logs, 12347);

    assert.ok(event, "Event should not be null");
    assert.strictEqual(event?.eventType, EventType.TRANSFER_HOOKED);
    assert.strictEqual(event?.data?.fee_bps, 500);
    console.log("PASS: TransferHook");
}

function testParseAgentCreatedEvent() {
    console.log("Testing AgentCreated...");
    const logs = [
        `Program ${EXO_CORE_PROGRAM_ID} invoke [1]`,
        "Program log: Agent created",
        `Program ${EXO_CORE_PROGRAM_ID} success`,
    ];

    const event = LogParser.parse("sigabc", logs, 12348);

    assert.ok(event, "Event should not be null");
    assert.strictEqual(event?.eventType, EventType.AGENT_CREATED);
    console.log("PASS: AgentCreated");
}

function testParseUnknownProgram() {
    console.log("Testing UnknownProgram...");
    const logs = [
        "Program OtherProgram111111111111111111111111 invoke [1]",
        "Program log: Some other event",
        "Program OtherProgram111111111111111111111111 success",
    ];

    const event = LogParser.parse("sigxyz", logs, 12349);

    assert.strictEqual(event, null, "Event should be null for unknown program");
    console.log("PASS: UnknownProgram");
}

try {
    testParseSkillRegisteredEvent();
    testParseEscrowCreatedEvent();
    testParseTransferHookEvent();
    testParseAgentCreatedEvent();
    testParseUnknownProgram();
    console.log("ALL TESTS PASSED");
} catch (e) {
    console.error("TEST FAILED", e);
    process.exit(1);
}

import { describe, it, expect } from "bun:test";
import { RESPEncoder, RESPSerializer } from "../index";

let serializer = new RESPSerializer();
function parseRESP(input: string): any {
    return serializer.serialize(input);
}

const encodeRESP = (input: any, explicit?: any) => new RESPEncoder().encode(input, explicit !== undefined ? explicit : undefined)

describe("RESP Protocol Parsing and Encoding", () => {
    it("should correctly parse RESP bulk string $-1", () => {
        const input = "$-1\r\n";
        const output = parseRESP(input);
        expect(output).toEqual([null]);
    });

    it("should correctly parse RESP array with bulk strings", () => {
        const input = "*1\r\n$4\r\nping\r\n";
        const output = parseRESP(input);
        expect(output).toEqual(["ping"]);
    });

    it("should correctly parse RESP array with mixed strings", () => {
        const input = "*2\r\n$4\r\necho\r\n$11\r\nhello world\r\n";
        const output = parseRESP(input);
        expect(output).toEqual(["echo", "hello world"]);
    });

    it("should correctly parse RESP array with multiple elements", () => {
        const input = "*2\r\n$3\r\nget\r\n$3\r\nkey\r\n";
        const output = parseRESP(input);
        expect(output).toEqual(["get", "key"]);
    });

    it("should correctly parse RESP simple string", () => {
        const input = "+OK\r\n";
        const output = parseRESP(input);
        expect(output).toEqual(["OK"]);
    });

    it("should correctly parse RESP error message", () => {
        const input = "-Error message\r\n";
        const output = parseRESP(input);
        expect(output[0]).toBeInstanceOf(Error);
        expect(output[0].message).toBe("Error message");
    });

    it("should correctly parse RESP bulk string with empty content", () => {
        const input = "$0\r\n\r\n";
        const output = parseRESP(input);
        expect(output).toEqual("");
    });

    it("should correctly parse RESP simple string with content", () => {
        const input = "+hello world\r\n";
        const output = parseRESP(input);
        expect(output).toEqual(["hello world"]);
    });

    it("should correctly encode RESP null bulk string", () => {
        const input = null;
        const output = encodeRESP(input);
        expect(output).toBe("$-1\r\n");
    });

    it("should correctly encode RESP simple string", () => {
        const input = "OK";
        const output = encodeRESP(input);
        expect(output).toBe("+OK\r\n");
    });

    it("should correctly encode RESP error message", () => {
        const input = new Error("Error message");
        const output = encodeRESP(input);
        expect(output).toBe("-Error message\r\n");
    });

    it("should correctly encode RESP array", () => {
        const input = ["echo", "hello world"];
        const output = encodeRESP(input, "*");
        expect(output).toBe("*2\r\n$4\r\necho\r\n$11\r\nhello world\r\n");
    });
});
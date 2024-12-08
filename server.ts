import { RESPBuilder, RESPSerializer } from ".";

// Helper function to format data for logging
function formatData(data: Uint8Array): string {
    // Try to decode as UTF-8 first
    try {
        return new TextDecoder().decode(data);
    } catch {
        // If decoding fails, return hex representation
        return Array.from(data)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join(' ');
    }
}

function formatDataForConsole(data: Uint8Array): string {
    try {
        const text = new TextDecoder().decode(data);
        // Replace common control characters with visible escape sequences
        return text
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t');
    } catch {
        return Array.from(data)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join(' ');
    }
}

const Database = new Map()

// Basics
Database.set("int", 1)
Database.set("string", "hello")

const server = Bun.listen({
    hostname: "0.0.0.0",  // Listen on all interfaces
    port: 6379,
    socket: {
        async data(socket, data) {
            const timestamp = new Date().toISOString();
            const remoteAddr = `${socket.remoteAddress}`;
            // console.log(`[${timestamp}] [${remoteAddr}] RECV: ${formatDataForConsole(data)}`);
            let serializer = new RESPSerializer()
            let parsed = serializer.serialize(formatData(data))
            // console.log(`[${timestamp}] [${remoteAddr}] PARS: ${parsed}`)
            if (parsed == "PING") {
                let msg = new RESPBuilder("Simple Strings").setMessage("PONG").build()
                // console.log(`[${new Date().toISOString()}] [${remoteAddr}] SEND: ${formatDataForConsole(new TextEncoder().encode(msg))}`)
                await socket.write(msg)
            } else {
                if (typeof parsed == typeof []) {
                    try {
                        let command = parsed[0] as string;
                        // console.log(command)
                        let args = (parsed as []).splice(1)
                        // console.log(args)
                        switch (command.toLowerCase()) {
                            case 'set': {
                                if (args.length != 2) {
                                    let err = new RESPBuilder("Errors").setError("Expected 2 arguments for set, got " + args.length).build()
                                    await socket.write(err)
                                } else {
                                    let key = args[0]
                                    let value: any = args[1]
                                    if (isNaN(value)) {
                                        Database.set(key, value)
                                    } else {
                                        value = Number(value)
                                        // console.log(Number.isInteger(value), parseInt(value))
                                        if (Number.isInteger(value)) value = parseInt(value)
                                        Database.set(key, value)
                                    }
                                    let success = new RESPBuilder("Simple Strings").setMessage("OK").build()
                                    await socket.write(success)
                                }
                            } break;

                            case 'get': {
                                if (args.length != 1) {
                                    let err = new RESPBuilder("Errors").setError("Expected 1 argument for get, got " + args.length).build()
                                    await socket.write(err)
                                } else {
                                    let key = args[0]
                                    let value = Database.get(key)
                                    if (!value) {
                                        let err = new RESPBuilder("Bulk Strings").setLength(-1).build()
                                        await socket.write(err)
                                    } else {
                                        // console.log(typeof value)
                                        if (isNaN(value)) {
                                            let resp = new RESPBuilder("Simple Strings").setMessage(value).build();
                                            await socket.write(resp)
                                        } else {
                                            let int = new RESPBuilder("Integers").setInteger(value).build()
                                            await socket.write(int)
                                        }
                                    }
                                }
                            } break;

                            default: {
                                let OK = new RESPBuilder("Simple Strings").setMessage("OK").build()
                                await socket.write(OK)
                            }
                        }
                    } catch (e: any) {
                        let err = new RESPBuilder("Errors").setError("An error occured while parsing the arguments")
                    }
                }
            }
        },

        open(socket) {
            const timestamp = new Date().toISOString();
            const remoteAddr = `${socket.remoteAddress}`;
            // console.log(`[${timestamp}] New connection from ${remoteAddr}`);
        },

        close(socket) {
            const timestamp = new Date().toISOString();
            const remoteAddr = `${socket.remoteAddress}`;
            // console.log(`[${timestamp}] Connection closed from ${remoteAddr}`);
        },

        error(socket, error) {
            const timestamp = new Date().toISOString();
            const remoteAddr = `${socket.remoteAddress}`;
            console.error(`[${timestamp}] [${remoteAddr}] ERROR:`, error);
        },
    },
});

const timestamp = new Date().toISOString();
// console.log(`[${timestamp}] Redis Server listening on ${server.hostname}:${server.port}`);
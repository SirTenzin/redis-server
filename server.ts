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

const server = Bun.listen({
    hostname: "0.0.0.0",  // Listen on all interfaces
    port: 6379,
    socket: {
        async data(socket, data) {
            const timestamp = new Date().toISOString();
            const remoteAddr = `${socket.remoteAddress}`;
            console.log(`[${timestamp}] [${remoteAddr}] RECV: ${formatDataForConsole(data)}`);
            let serializer = new RESPSerializer()
            let parsed = serializer.serialize(formatData(data)) 
            console.log(`[${timestamp}] [${remoteAddr}] PARS: ${parsed}`)
            console.log(`[${timestamp}] [${remoteAddr}] ${parsed == "PING"} ${parsed} PING`)
            if(parsed == "PING") {
                let msg = new RESPBuilder("Simple Strings").setMessage("PONG").build()
                console.log(msg)
                await socket.write(msg)
            }
        },

        open(socket) {
            const timestamp = new Date().toISOString();
            const remoteAddr = `${socket.remoteAddress}`;
            console.log(`[${timestamp}] New connection from ${remoteAddr}`);
        },

        close(socket) {
            const timestamp = new Date().toISOString();
            const remoteAddr = `${socket.remoteAddress}`;
            console.log(`[${timestamp}] Connection closed from ${remoteAddr}`);
        },

        error(socket, error) {
            const timestamp = new Date().toISOString();
            const remoteAddr = `${socket.remoteAddress}`;
            console.error(`[${timestamp}] [${remoteAddr}] ERROR:`, error);
        },
    },
});

const startupMsg = `TCP Server listening on ${server.hostname}:${server.port}`;
const timestamp = new Date().toISOString();
console.log(`[${timestamp}] ${startupMsg}`);
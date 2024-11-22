export class RESPSerializer {
    dataTypes = {
        "+": 43,
        "-": 45,
        ":": 58,
        "$": 36,
        "*": 42
    };

    super() {

    }


    // Step 1
    // In this step your goal is to build the functionality to serialise and de-serialise Redis Serialisation Protocol (RESP) messages. This is the protocol used to communicate with a Redis Server. You may want to refer to the RESP protocol specification.

    // Redis uses RESP as a request-response protocol in the following way:

    // Clients send commands to a Redis Server as a RESP Array of Bulk Strings.
    // The server replies with one of the RESP types according to the command implementation.
    // In RESP, the first byte determines the data type:

    // For Simple Strings, the first byte of the reply is "+"
    // For Errors, the first byte of the reply is "-"
    // For Integers, the first byte of the reply is ":"
    // For Bulk Strings, the first byte of the reply is "$"
    // For Arrays, the first byte of the reply is "*"
    // RESP can represent a Null value using a special variation of Bulk Strings: "$-1\r\n" or Array: "*-1\r\n".

    // Now that we have the basics of the protocol, your challenge is to write the code required to serialise and de-serialise messages. My personal approach to this would be to use test-driven development (TDD) to build tests for some example messages, i.e.:

    // "$-1\r\n"
    // "*1\r\n$4\r\nping\r\n”
    // "*2\r\n$4\r\necho\r\n$11\r\nhello world\r\n”
    // "*2\r\n$3\r\nget\r\n$3\r\nkey\r\n”
    // "+OK\r\n"
    // "-Error message\r\n"
    // "$0\r\n\r\n"
    // "+hello world\r\n”
    // Plus some invalid test cases to test outside the happy path.

    _getBytes(string: string): Uint8Array {
        return new TextEncoder().encode(string);
    }

    _detectDataType(firstByte: Uint8Array) {
        let dataType = '';
        switch (firstByte[0]) {
            case 43:
                dataType = 'Simple Strings';
                break;
            case 45:
                dataType = 'Errors';
                break;
            case 58:
                dataType = 'Integers';
                break;
            case 36:
                dataType = 'Bulk Strings';
                break;
            case 42:
                dataType = 'Arrays';
                break;
            default:
                dataType = 'Unknown';
        }
        return dataType;
    }

    isNull(data: string) {
        return data === '-1';
    }


    serialize(message: string) {
        let bytes = this._getBytes(message);
        let dataType = this._detectDataType(bytes);

        switch(dataType) {
            case 'Bulk Strings': {
                let data = message.split("$")[1].split('\r\n').filter((item) => item !== '');
                if(this.isNull(data[0])) {
                    return [null];
                }
            } break;
        }
    }
}

let serializer = new RESPSerializer();
[   
    "$-1\r\n",
    "*1\r\n$4\r\nping\r\n",
    "*2\r\n$4\r\necho\r\n$11\r\nhello world\r\n",
    "*2\r\n$3\r\nget\r\n$3\r\nkey\r\n",
    "+OK\r\n",
    "-Error message\r\n",
    "$0\r\n\r\n",
    "+hello world\r\n"
].forEach((message) => {
    console.log(serializer.serialize(message));
})

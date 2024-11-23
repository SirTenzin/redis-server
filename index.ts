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
            case 'Simple Strings': {
                return [message.split("+")[1].split('\r\n')[0]];
            };

            case 'Errors': {
                return [new Error(message.split("-")[1].split('\r\n')[0])];
            };

            case 'Arrays': {
                let cmd = message.split("*")[1].split('\r\n');
                // console.log("cmd", cmd);
                let cmdSize = cmd[0];
                let data = cmd.slice(1);
                let parsed: any = [];
                let y = data.map((x, index) => {
                    if(x.startsWith("$")) {
                        let bulkString = x + "\r\n" + data[index + 1] + "\r\n";
                        let str = this.serialize(bulkString);
                        parsed.push(str);
                    }
                })

                if (parsed.length !== parseInt(cmdSize)) throw new Error("Invalid Array: Length specified is not equal to the data length");

                return parsed;
            } break;

            case 'Bulk Strings': {
                let data = message.split("$")[1].split('\r\n');
                if(this.isNull(data[0])) {
                    return [null];
                } else {
                    let parsed: string = "";
                    if(data[0] === '0') return "";
                    // console.log("Bulk String Data", data);
                    data.forEach(x => {
                        // If its a number, we can parse the next value
                        if(!Number.isNaN(parseInt(x))) {
                            // Access the next index and send it to the parsed array
                            let nextIndex = data.indexOf(x) + 1;
                            if(!data[nextIndex]) return;
                            if(data[nextIndex].length !== parseInt(x)) throw new Error("Invalid Bulk String: Length specified is not equal to the data length");

                            parsed = data[nextIndex];
                        }
                    })

                    return parsed
                }
            } break;
        }
    }
}

// let serializer = new RESPSerializer();
// [   
//     "$-1\r\n", // DONE
//     "*1\r\n$4\r\nping\r\n", // DONE
//     "*2\r\n$4\r\necho\r\n$11\r\nhello world\r\n", // DONE
//     "*2\r\n$3\r\nget\r\n$3\r\nkey\r\n",
//     "+OK\r\n", // DONE
//     "-Error message\r\n", // DONE
//     "$0\r\n\r\n", // DONE
//     "+hello world\r\n",
//     "$4\r\nping\r\n", // DONE

// ].forEach((message) => {
//     console.log(serializer.serialize(message));
// })


// [ null ] = new RESPBuilder("Bulk Strings").

export class RESPBuilder {

    dataTypes: {
        [key: string]: string
    } = {
        "Simple Strings": "+",
        "Errors": "-",
        "Integers": ":",
        "Bulk Strings": "$",
        "Arrays": "*",
    };

    dataType = "";
    length = 0;
    script = "";

    constructor(dataType: string) {
        if(!dataType) throw new Error("Data Type is required");
        this.dataType = dataType;
        if(!Object.keys(this.dataTypes).includes(dataType)) throw new Error("Invalid Data Type");
        this.script += this.dataTypes[dataType];
    }

    setLength(length: number) {
        if(!length) throw new Error("Length is required");
        if(!["Bulk Strings", "Arrays"].includes(this.dataType)) throw new Error("Length can only be set for Bulk Strings and Arrays");
        this.length = length;
        this.script += length + "\r\n";
        return this;
    }

    appendString(data: string) {
        if(!data) throw new Error("Data is required");
        if(this.dataType !== "Bulk Strings") throw new Error("Data can only be set for Bulk Strings");
        this.script += "$" + data.length + "\r\n" + data + "\r\n";
        return this;
    }

    setMessage(data: string) {
        if(!data) throw new Error("Data is required");
        if(this.dataType !== "Simple Strings") throw new Error("Data can only be set for Simple Strings");
        this.script += data + "\r\n";
        return this;
    }

    setError(data: string) {
        if(!data) throw new Error("Data is required");
        if(this.dataType !== "Errors") throw new Error("Data can only be set for Errors");
        this.script += data + "\r\n";
        return this;
    }

    build() {
        return this.script;
    }
}
export class RESPSerializer {
    dataTypes = {
        "+": 43,
        "-": 45,
        ":": 58,
        "$": 36,
        "*": 42
    };

    constructor() {

    }

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

        switch (dataType) {
            case 'Simple Strings': {
                return [message.split("+")[1].split('\r\n')[0]];
            };

            case 'Errors': {
                return [new Error(message.split("-")[1].split('\r\n')[0])];
            };

            case 'Arrays': {
                let cmd = message.split("*")[1].split('\r\n');
                let cmdSize = cmd[0];
                let data = cmd.slice(1);
                let parsed: any = [];
                let y = data.map((x, index) => {
                    if (x.startsWith("$")) {
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
                if (this.isNull(data[0])) {
                    return [null];
                } else {
                    let parsed: string = "";
                    if (data[0] === '0') return "";
                    data.forEach(x => {
                        if (!Number.isNaN(parseInt(x))) {
                            let nextIndex = data.indexOf(x) + 1;
                            if (!data[nextIndex]) return;
                            if (data[nextIndex].length !== parseInt(x)) throw new Error("Invalid Bulk String: Length specified is not equal to the data length");

                            parsed = data[nextIndex];
                        }
                    })

                    return parsed
                }
            } break;
        }
    }
}

export class RESPEncoder {

    dataTypes: {
        [key: string]: string
    } = {
            "Simple Strings": "+",
            "Errors": "-",
            "Integers": ":",
            "Bulk Strings": "$",
            "Arrays": "*",
        };

    dataType: string = "";

    constructor() {}

    encode(input: any, explicit?: any) {
        switch (typeof input) {
            case "string": {
                this.dataType = this.dataTypes["Simple Strings"];
                return `${this.dataType}${input}\r\n`;
            }

            case typeof Error: {
                this.dataType = this.dataTypes["Errors"]
            } break;

            case "number": {
                if(Number.isInteger(input)) {
                    this.dataType = this.dataTypes["Integers"]
                } else throw new Error("Must be integer")
            } break;
            
            case "object": {
                if(input == null || input == undefined) {
                    return "$-1\r\n"
                } else if(input instanceof Error) {
                    this.dataType = this.dataTypes["Errors"]
                    return `${this.dataType}${input.message}\r\n`;
                } else if (Array.isArray(input) && input.every(x => typeof x === "string")) {
                    this.dataType = explicit != null ? `${explicit}${input.length}\r\n` : this.dataTypes["Bulk Strings"]
                    let str = "";
                    str += this.dataType
                    input.forEach(string => {
                        str += `$${string.length}\r\n${string}\r\n`
                    })
                    return str;
                } else throw new Error("Must be array of strings or array")
            } break;

            case null: {
                return "$-1\r\n"
            }

            default: {
                throw new Error("Type " + typeof input + " is unsupported.")
            }
        }
    }


}

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
        if (!dataType) throw new Error("Data Type is required");
        this.dataType = dataType;
        if (!Object.keys(this.dataTypes).includes(dataType)) throw new Error("Invalid Data Type");
        this.script += this.dataTypes[dataType];
    }

    setInteger(int: number) {
        if (!["Integers"].includes(this.dataType)) throw new Error("Data type must be of \":\" / integer")
        else if (!Number.isInteger(int)) throw new Error("Argument must be an integer")
        else {
            this.script += int + "\r\n"
            return this;
        }
    }

    setLength(length: number) {
        if (!length) throw new Error("Length is required");
        if (!["Bulk Strings", "Arrays"].includes(this.dataType)) throw new Error("Length can only be set for Bulk Strings and Arrays");
        this.length = length;
        if (length == -1) {
            this.script = "$-1\r\n";
            return this;
        }
        this.script += length.toString() + "\r\n";
        return this;
    }

    appendString(data: string) {
        if (!data) throw new Error("Data is required");
        if (this.dataType !== "Bulk Strings") throw new Error("Data can only be set for Bulk Strings");
        this.script += "$" + data.length + "\r\n" + data + "\r\n";
        return this;
    }

    setMessage(data: string) {
        if (!data) throw new Error("Data is required");
        if (this.dataType !== "Simple Strings") throw new Error("Data can only be set for Simple Strings");
        this.script += data + "\r\n";
        return this;
    }

    setError(data: string) {
        if (!data) throw new Error("Data is required");
        if (this.dataType !== "Errors") throw new Error("Data can only be set for Errors");
        this.script += data + "\r\n";
        return this;
    }

    build() {
        return this.script;
    }
}
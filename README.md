# Bun Redis Server

Following the challenge at [CodingChallenges](https://codingchallenges.fyi/challenges/challenge-redis), this is a simple redis server implementation in Bun. It parses and encodes Redis Serialization Protocol (RESP) messages and can currently run the GET and SET commands at a benchmark speed of:

> $ redis-benchmark -t set,get -n 100000 -q 

> SET: 75414.78 requests per second, p50=0.543 msec   

> GET: 83752.09 requests per second, p50=0.495 msec     

The native redis benchmark returns:

> $ redis-benchmark -t set,get -n 100000 -q 

> SET: 96432.02 requests per second, p50=0.255 msec    
               
> GET: 97370.98 requests per second, p50=0.255 msec 


# Features:

- RESP Parser

This can parse a RESP client string such as: "*2\r\n$3\r\nget\r\n$3\r\nkey\r\n" into ["get", "key"]

- RESP Encoder

This can encode a server response into RESP, for example if you get'ed "key" and it was "value", the server would encode the response to be: "+value\r\n", or ":999\r\n" if the value was "999".

- RESP Builder

An utility class to use a chain of functions to build a RESP response. Not really necessary technically but its easier to read the code this way.

# Gallery:

## Getting and setting

![Getting and Setting](https://github.com/SirTenzin/redis-server/blob/master/image.png?raw=true)

# Benchmark

![Benchmark Video](https://cloud-cxdbuzlga-hack-club-bot.vercel.app/0benchmark.mp4)

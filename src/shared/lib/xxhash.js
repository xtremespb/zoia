import xxh from 'xxhashjs';

export default (data, seed) => xxh.h64(data, seed).toString(16);

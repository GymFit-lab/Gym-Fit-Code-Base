-- Extensions. pgcrypto: gen_salt()/crypt() for bcrypt password hashes; citext: case-insensitive emails.
create extension if not exists pgcrypto;
create extension if not exists citext;

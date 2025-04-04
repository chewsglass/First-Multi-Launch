import {
    PublicKey, Keypair, VersionedTransaction, ComputeBudgetProgram,
    TransactionMessage, TransactionInstruction, SystemProgram, Transaction, Connection, AddressLookupTableProgram
  } from '@solana/web3.js';
import {  u8, u32,struct,  } from "@solana/buffer-layout"
import { bool, u64, publicKey } from "@solana/buffer-layout-utils"
import * as spl from "@solana/spl-token"
import BN from "bn.js"
import bs58 from "bs58"
import FormData from 'form-data'
import fs from "fs";
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { getDualLaunchIxs } from "./dualLaunch.mjs"
const mpl = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
const connection = new Connection(`https://`)
const owner = Keypair.fromSecretKey(bs58.decode("2yApWHp1MxSTiijFv4inFH3iHTde7ct8urs7rURKUYmeUUaSn"))



const table = (await connection.getAddressLookupTable(new PublicKey("7sVCcxZc9MLBupYZHCEfAQfkDWvoyRShuBSXv7tKBz7f"))).value

const image = "./image.png"
const tokensAmountRaw = 1234567  * 10 ** 6
const name = "First Multi Launch"
const symbol = "FML"
const description = "This token is the first token to be launched on both Pump.fun and Pumpswap simultaneously. Since there can only be 1 pool for a given pair on Pumpswap, what will happen when this bonds and migrates? Let's find out!"
const twitter = "https://x.com/"
const telegram = "https://t.me/"
const website = "https://www.bobross.com/"
const mintSigner = Keypair.generate()
const mint = mintSigner.publicKey
const keys = await getPumpKeys(owner.publicKey, mint)
const metadata = await getMetadata(image, name, symbol, description, twitter, telegram, website);
console.log(metadata)
const launchIxs = await createPumpToken(keys, metadata);
const buyIxs = await buyPumpToken(keys)
const dualLaunchIxs = await getDualLaunchIxs(owner, mint)
const ixs = [...launchIxs, ...buyIxs, ...dualLaunchIxs]
const msg = new TransactionMessage({
    payerKey: owner.publicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: ixs
}).compileToV0Message([table])

const vTx = new VersionedTransaction(msg)
vTx.sign([owner, mintSigner])
const sim = await connection.sendRawTransaction(vTx.serialize())
console.log(sim)


  async function createPumpToken(pumpKeys, res) {
    let ixs = []
    const stupidMath = num => num.toString(16).padStart(2, '0').slice(-2).padEnd(8, '0');
    ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1500000 }))
    const objName = stupidMath(res.metadata.name.length)
    const objSymbol = stupidMath(res.metadata.symbol.length)
    const objUri = stupidMath(res.metadataUri.length)
	console.log(objName, objSymbol, objUri)
    const disc = Buffer.from(Uint8Array.from([24, 30, 200, 40, 5, 28, 7, 119]))
    const discHex = disc.toString("hex")
    const nameBuffer = Buffer.from(res.metadata.name, "utf-8")
    const nameHex = nameBuffer.toString("hex")
    const symbolBuffer = Buffer.from(res.metadata.symbol, "utf-8")
    const symbolHex = symbolBuffer.toString("hex")
    const uriBuffer = Buffer.from(res.metadataUri, "utf-8")
    const uriHex = uriBuffer.toString("hex")
    const args = discHex + objName + nameHex + objSymbol + symbolHex + objUri + uriHex
    const createIxData = Buffer.from(args, "hex")
const newIxData = Buffer.concat([createIxData, Buffer.from("601f516fb7766dd093b02283422b3e9b1c87613414020d0ba03ed45a379f4a03", "hex")])
console.log(newIxData.toString("hex"))
    const accountMetas = [
      { pubkey: pumpKeys.mint, isSigner: true, isWritable: true },
      { pubkey: pumpKeys.mintAuthority, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.bonding, isSigner: false, isWritable: true },
      { pubkey: pumpKeys.associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: pumpKeys.global, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.mplTokenMetadata, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.metadata, isSigner: false, isWritable: true },
      { pubkey: pumpKeys.user, isSigner: true, isWritable: true },
      { pubkey: pumpKeys.systemProgram, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.tokenProgram, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.associatedTokenProgram, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.rent, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.eventAuthority, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.program, isSigner: false, isWritable: false }]
    const programId = new PublicKey(pumpKeys.program)
    const instruction = new TransactionInstruction({ keys: accountMetas, programId, data: newIxData })
    ixs.push(instruction)
    return (ixs)
  }

  async function getPumpKeys(user, mint) {
    const metadata = PublicKey.findProgramAddressSync([Buffer.from('metadata'), mpl.toBuffer(), mint.toBuffer()], mpl)[0]
    const program = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P")
    const mplTokenMetadata = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    const tokenProgram = spl.TOKEN_PROGRAM_ID
    const ataProgram = spl.ASSOCIATED_TOKEN_PROGRAM_ID
    const systemProgram = PublicKey.default
    const mintAuthority = new PublicKey("TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM")
    const eventAuthority = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1")
    const feeRecipient = new PublicKey("68yFSZxzLWJXkxxRGydZ63C6mHx1NLEDWmwN9Lb5yySg")
    const rent = new PublicKey("SysvarRent111111111111111111111111111111111")
    const userAssociatedToken = await getOwnerAta(mint, user)
    const seeds = [Buffer.from('global', 'utf-8'), Buffer.from('bonding-curve', 'utf-8'), Buffer.from('metadata', 'utf-8')]
    const global = PublicKey.findProgramAddressSync([seeds[0]], program)[0]
    const bonding = PublicKey.findProgramAddressSync([seeds[1], mint.toBuffer()], program)[0];
    const associatedBondingCurve = await spl.getAssociatedTokenAddress(mint, bonding, { allowOwnerOffCurve: true })
    const pumpKeys = {
      mint: mint,
      mintAuthority: mintAuthority,
      bonding: bonding,
      associatedBondingCurve: associatedBondingCurve,
      global: global,
      mplTokenMetadata: mplTokenMetadata,
      metadata: metadata,
      user: user,
      systemProgram: systemProgram,
      tokenProgram: tokenProgram,
      associatedTokenProgram: ataProgram,
      rent: rent,
      eventAuthority: eventAuthority,
      program: program,
      sellEventAuthority: new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1"),
      feeRecipient: new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"),
      userAssociatedToken: userAssociatedToken
    }
    return (pumpKeys)
  }

  async function buyPumpToken(pumpKeys) {
    const ixs = []
    const createAta = spl.createAssociatedTokenAccountIdempotentInstruction(pumpKeys.user, pumpKeys.userAssociatedToken, pumpKeys.user, pumpKeys.mint)
    const buffer = Buffer.alloc(24)
    new BN(tokensAmountRaw).toArrayLike(Buffer, 'le', 8).copy(buffer, 8)
    new BN(99999999999).toArrayLike(Buffer, 'le', 8).copy(buffer, 16)
    Buffer.from("66063d1201daebea", "hex").copy(buffer, 0)
    const accountMetas = [
      { pubkey: pumpKeys.global, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.feeRecipient, isSigner: false, isWritable: true },
      { pubkey: pumpKeys.mint, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.bonding, isSigner: false, isWritable: true },
      { pubkey: pumpKeys.associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: pumpKeys.userAssociatedToken, isSigner: false, isWritable: true },
      { pubkey: pumpKeys.user, isSigner: true, isWritable: true },
      { pubkey: pumpKeys.systemProgram, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.tokenProgram, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.rent, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.sellEventAuthority, isSigner: false, isWritable: false },
      { pubkey: pumpKeys.program, isSigner: false, isWritable: false }]
    const programId = new PublicKey(pumpKeys.program)
    const instruction = new TransactionInstruction({ keys: accountMetas, programId, data: buffer })
    const priorityFee = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150000 })
	ixs.push(createAta)
    ixs.push(instruction)
    return (ixs)
  }

async function getOwnerAta(mint, owner) {
const foundAta = PublicKey.findProgramAddressSync([owner.toBuffer(), spl.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], spl.ASSOCIATED_TOKEN_PROGRAM_ID)[0]
return(foundAta) }


async function getMetadata(image, name, symbol, description, twitter, telegram, website) {
const imageBuffer = fs.readFileSync(image);
const meta = new FormData();
meta.append("file", imageBuffer, { filename: 'image.png' })
meta.append("name", name)
meta.append("symbol", symbol)
meta.append("description", description)
meta.append("twitter", twitter)
meta.append("telegram", telegram)
meta.append("website", website)
meta.append("showName", "true")
const res = await fetch("https://pump.fun/api/ipfs", { method: "POST", body: meta })
if (!res.ok) { throw new Error(`HTTP error! Status: ${res.status}`) }
const jsonResponse = await res.json()
return jsonResponse }

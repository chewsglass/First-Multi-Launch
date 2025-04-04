import { Connection, PublicKey, Keypair, Transaction, SystemProgram, TransactionInstruction} from "@solana/web3.js"
import * as spl from "@solana/spl-token"
import BN from "bn.js"

export async function getDualLaunchIxs(owner, baseMint) {

//const owner = Keypair.fromSecretKey(Uint8Array.from([94,223,132,39,63,69,96,80,251,102,242,67,69,192,156,134,248,103,247,208,114,141,235,80,228,157,246,15,152]))
const baseAmountIn = 1234567 * 10 ** 6
const quoteAmountIn = 1234567
const connection = new Connection(`https://`)
const pumpFunProgram = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P")
const pumpSwapProgram = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA")
const tokenProgram = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
const wSolMint = new PublicKey("So11111111111111111111111111111111111111112")
const feeRecipient = new PublicKey("62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV")
const eventAuthority = new PublicKey("GS4CU59F31iL7aR2Q8zVS8DRrcRnXX1yjQ66TqNVQnaR")
const globalConfig = new PublicKey("ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw")
const baseMintSigner = Keypair.generate()
//const baseMint = baseMintSigner.publicKey
const quoteMint = wSolMint
const index = 0
const poolPda = await getPoolPda(owner.publicKey)
const lpMintPda = await getLpPda(poolPda)
const ownerBaseAta = await getOwnerAta(baseMint, owner.publicKey)
const ownerQuoteAta = await getOwnerAta(quoteMint, owner.publicKey)
const ownerLpAta = await getOwnerAtaNew(lpMintPda, owner.publicKey)
const poolBaseAta = await getOwnerAta(baseMint, poolPda)
const poolQuoteAta = await getOwnerAta(quoteMint, poolPda)

const bytes = Buffer.from("e992d18ecf6840bc00000080f420e6b5000000d6117e03000000","hex")
const disc = bytes.slice(0, 8)

async function getOwnerAta(mint, owner) {
const foundAta = PublicKey.findProgramAddressSync([owner.toBuffer(), spl.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], spl.ASSOCIATED_TOKEN_PROGRAM_ID)[0]
return(foundAta) }

async function getOwnerAtaNew(mint, owner) {
const foundAta = PublicKey.findProgramAddressSync([owner.toBuffer(), spl.TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()], spl.ASSOCIATED_TOKEN_PROGRAM_ID)[0]
return(foundAta) }

async function getPoolPda(owner) {
const poolPda = PublicKey.findProgramAddressSync([Buffer.from("pool"), new BN(0).toArrayLike(Buffer, "le", 2), owner.toBuffer(), baseMint.toBuffer(), quoteMint.toBuffer()], pumpSwapProgram)[0]
return poolPda }

async function getLpPda(pool){
return PublicKey.findProgramAddressSync([Buffer.from("pool_lp_mint"), pool.toBuffer()], pumpSwapProgram)[0] }

async function getCreateAtaIx(ata, ataOwner, mint) {
const createAtaIx = spl.createAssociatedTokenAccountIdempotentInstruction(owner.publicKey, ata, ataOwner, mint)
return createAtaIx }
console.log("LP PDA", lpMintPda, "LP ATA:", ownerLpAta)

const partialData = Buffer.alloc(18)
new BN(0).toArrayLike(Buffer, "le", 8).copy(partialData, 0)
new BN(baseAmountIn).toArrayLike(Buffer, "le", 8).copy(partialData, 2)
new BN(quoteAmountIn).toArrayLike(Buffer, "le", 8).copy(partialData, 10)
const data = Buffer.concat([disc, partialData])
const createPumpSwapInstruction = new TransactionInstruction({
keys: [
{ pubkey: poolPda, isSigner: false, isWritable: true }, // pool pda
{ pubkey: globalConfig, isSigner: false, isWritable: false }, // global config
{ pubkey: owner.publicKey, isSigner: true, isWritable: true }, // owner
{ pubkey: baseMint, isSigner: false, isWritable: false }, // base mint
{ pubkey: quoteMint, isSigner: false, isWritable: false }, // quote mint
{ pubkey: lpMintPda, isSigner: false, isWritable: true }, // lp mint
{ pubkey: ownerBaseAta, isSigner: false, isWritable: true }, // owner base ata2
{ pubkey: ownerQuoteAta, isSigner: false, isWritable: true }, // owner quote ata
{ pubkey: ownerLpAta, isSigner: false, isWritable: true }, // owner lp ata
{ pubkey: poolBaseAta, isSigner: false, isWritable: true }, // pool base ata
{ pubkey: poolQuoteAta, isSigner: false, isWritable: true }, // pool quote ata
{ pubkey: PublicKey.default, isSigner: false, isWritable: true }, // system program
{ pubkey: spl.TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: true }, // token 2022 program
{ pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: true }, // base token program
{ pubkey: spl.TOKEN_PROGRAM_ID, isSigner: false, isWritable: true }, // quote token program
{ pubkey: spl.ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: true }, // associated token program
{ pubkey: eventAuthority, isSigner: false, isWritable: true }, // event authority
{ pubkey: pumpSwapProgram, isSigner: false, isWritable: true }],
programId: pumpSwapProgram,
data})
let ixs = []
const createOwnerBaseAtaIx = await getCreateAtaIx(ownerBaseAta, owner.publicKey, baseMint)
const createOwnerQuoteAtaIx = await getCreateAtaIx(ownerQuoteAta, owner.publicKey, quoteMint)
const transfer = SystemProgram.transfer({fromPubkey: owner.publicKey, toPubkey: ownerQuoteAta, lamports: 1234567})
const syncNative = spl.createSyncNativeInstruction(ownerQuoteAta)
const createPoolBaseAtaIx = await getCreateAtaIx(poolBaseAta, poolPda, baseMint)
const createPoolQuoteAtaIx = await getCreateAtaIx(poolQuoteAta, poolPda, quoteMint)
ixs.push(createOwnerBaseAtaIx, createOwnerQuoteAtaIx, transfer, syncNative, createPoolBaseAtaIx, createPoolQuoteAtaIx, createPumpSwapInstruction)
//const tx = new Transaction().add(createOwnerBaseAtaIx).add(createOwnerQuoteAtaIx).add(transfer).add(syncNative).add(createPoolBaseAtaIx).add(createPoolQuoteAtaIx).add(createPumpSwapInstruction)
//const txHash = await connection.sendTransaction(tx, [owner])
return(ixs)

}

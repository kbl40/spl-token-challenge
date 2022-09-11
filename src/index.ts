import { initializeKeypair } from "./initializeKeypair"
import createMint from "./createMint"
import * as web3 from "@solana/web3.js"
import {
  PublicKey,
  Signer,
} from '@solana/web3.js'
import { 
  ACCOUNT_SIZE,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeAccountInstruction,
  createInitializeMintInstruction, 
  createMintToInstruction, 
  getAssociatedTokenAddress, 
  getMinimumBalanceForRentExemptMint, 
  MINT_SIZE, 
  TOKEN_PROGRAM_ID } from '@solana/spl-token'
import * as token from '@solana/spl-token'
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  findMetadataPda
} from '@metaplex-foundation/js'
import {
  DataV2, 
  createCreateMetadataAccountV2Instruction,
  createUpdateMetadataAccountV2Instruction
} from '@metaplex-foundation/mpl-token-metadata'
import * as fs from 'fs'

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)
  const mintKeypair = web3.Keypair.generate()
  const accountKeypair = web3.Keypair.generate()

  const programId = TOKEN_PROGRAM_ID
  const accountProgramId = TOKEN_PROGRAM_ID
  const associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
  const mintToProgramId = TOKEN_PROGRAM_ID

  const decimals = 2

  console.log("PublicKey:", user.publicKey.toBase58())

  const lamportsMint = await token.getMinimumBalanceForRentExemptMint(connection)
  const lamportsAccount = await token.getMinimumBalanceForRentExemptAccount(connection)

  const associatedToken = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    user.publicKey,
    false,
    programId,
    associatedTokenProgramId
  )



  const mintInfo = await token.getMint(connection, mintKeypair.publicKey)

  const transaction = new web3.Transaction().add(
    // Create Mint Account
    web3.SystemProgram.createAccount({
        fromPubkey: user.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: lamportsMint,
        programId
    }),
    // Initialize it as a Mint Account
    createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        user.publicKey,
        user.publicKey,
        programId
    ),
    // Create Token Account
    web3.SystemProgram.createAccount({
      fromPubkey: user.publicKey,
      newAccountPubkey: accountKeypair.publicKey,
      space: ACCOUNT_SIZE,
      lamports: lamportsAccount,
      programId: accountProgramId
    }),
    // Initialize Token Account
    createInitializeAccountInstruction(
      accountKeypair.publicKey,
      mintKeypair.publicKey,
      user.publicKey,
      accountProgramId
    ),
    // Create the Associated Token Account
    createAssociatedTokenAccountInstruction(
      user.publicKey,
      associatedToken,
      user.publicKey,
      mintKeypair.publicKey,
      programId,
      associatedTokenProgramId
    ),
    // Mint tokens
    createMintToInstruction(
      mintKeypair.publicKey,
      associatedToken,
      user.publicKey,
      100 * 10 ** mintInfo.decimals,
      user,
      mintToProgramId
    )

  )

  const txSig = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [user, mintKeypair, accountKeypair]
  )

  console.log(
    `Token Mint, Account Creation, Mint: https://explorer.solana.com/tx/${txSig}?cluster=devnet`
  )
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })

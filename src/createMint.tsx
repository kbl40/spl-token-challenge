import * as web3 from '@solana/web3.js'
import * as token from '@solana/spl-token'
import { createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from '@solana/spl-token'

export async function createMint(
    connection: web3.Connection,
    payer: web3.Keypair,
    mintAuthority: web3.PublicKey,
    freezeAuthority: web3.PublicKey | null,
    decimals: number,
    keypair = web3.Keypair.generate(),
    confirmOptions?: web3.ConfirmOptions ,
    programId = TOKEN_PROGRAM_ID
): Promise<web3.PublicKey> {
    const lamports = await getMinimumBalanceForRentExemptMint(connection)

    const transaction = new web3.Transaction().add(
        web3.SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: keypair.publicKey,
            space: MINT_SIZE,
            lamports,
            programId,
        }),
        createInitializeMintInstruction(
            keypair.publicKey,
            decimals,
            mintAuthority,
            freezeAuthority,
            programId
        )
    )

    await web3.sendAndConfirmTransaction(
        connection,
        transaction,
        [payer, keypair],
        confirmOptions
    )

    return keypair.publicKey 
}

export default createMint
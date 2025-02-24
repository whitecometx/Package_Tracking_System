import { Connection, PublicKey } from '@solana/web3.js';
import { EventParser, Program, Event } from '@coral-xyz/anchor';
import { CONFIG } from '../config';
import { SolTrackProgram } from '@/types/program_types';


export const setupEventListener = (
    program: SolTrackProgram,
    callback: (event: any) => void
  ) =>  {
  const parser = new EventParser(program.programId, program.coder);
  
  return program.provider.connection.onLogs(
    program.programId,
    ({ logs, err }) => {
      if (err) return;
      
      // Convert generator to array first
      const events = Array.from(parser.parseLogs(logs));
      
      // Type-safe iteration
      events.forEach((event: Event) => {
        callback(event);
      });
    },
    'confirmed'
  );
};
/**
 * The landing page "Try it" QR opens this roll (migration *_demo_roll). Generated
 * invite codes never contain the letter O, so this can't collide with a real roll.
 */
export const DEMO_INVITE_CODE = 'DEMO';

export function isDemoRoll(inviteCode: string): boolean {
  return inviteCode.toUpperCase() === DEMO_INVITE_CODE;
}

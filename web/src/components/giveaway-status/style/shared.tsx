export const SPECIAL_COMMAND_TEXT = {
  $gw2_account$: '[GW2 account name.####]',
  $steam_friend$: '[8 digit Steam friend code]',
  $gw2_or_steam$: '[GW2 account name or Steam friend code]',
}

export interface StatusProps {
  title?: string | null
  body?: string | null
  status?: string
  command?: string
  followersOnly?: boolean
  imageUrl?: string
  goalTs?: number
}

import { Chat, ChatItem } from '../chat'
import { ChannelInfo, DiscordSettings, GiveawayResult, Settings } from './types'
import { getDiscordColour, getRandomArrayItem, handleChatCommand } from './misc'
import { getFollowers, getSubs, getTwitchThumbnail } from './twitch'
import relay from './relay'
import toast from 'react-hot-toast'

const pastWinners = new Set()

function prepareStats() {
  const stats = {
    users: 0,
    followers: 0,
    subs: 0,
    finalEntries: 0,
    entries: 0,
    toast: () => {},
    data: () => {
      return {} as GiveawayResult['giveawayStats']
    },
  }
  stats.toast = function () {
    toast.success(
      `${stats.users} users, ${stats.subs} subs, ${stats.followers} followers, ${stats.finalEntries} entries`,
      {
        position: 'bottom-center',
        style: { fontSize: '1rem', padding: '0.2rem' },
      }
    )
  }
  stats.data = function (): GiveawayResult['giveawayStats'] {
    return {
      users: stats.users,
      followers: stats.followers,
      subs: stats.subs,
      finalEntries: stats.finalEntries,
      entries: stats.entries,
    }
  }
  return stats
}

type GiveawayInformation = Promise<{
  winners: GiveawayResult['winners']
  giveawayStats: GiveawayResult['giveawayStats']
}>

function isSubscriber(item: ChatItem, youtubeSubs: Map<any, any>) {
  if (item.source === 'twitch') {
    return item.isSubscriber
  }
  return youtubeSubs?.has(item.username)
}

async function fakeCache() {
  return new Map()
}

export function resetPastWinners() {
  pastWinners.clear()
}

export async function getChatGiveaway(
  chatClient: Chat,
  channelInfo: ChannelInfo,
  chatItems: ChatItem[],
  chatCommand: string,
  settings: Settings,
  discordSettings: DiscordSettings,
  forfeits: string[]
): Promise<GiveawayInformation> {
  const forfeitSet = new Set([...forfeits])
  const matchMap = new Map<string, Set<string>>()
  const userMatchMap = new Map<string, string>()
  const giveawayUserStats = prepareStats()
  console.info('[giveaway][chat][start]')
  let subCount = 0
  let subEntries = 0
  const nonblockedChatItems = chatItems.filter(
    (u) =>
      !settings.blocklist.map((b) => b.trim()).includes(u.displayName) &&
      !settings.blocklist.map((b) => b.trim()).includes(u.username)
  )
  const chatCommandEvents = nonblockedChatItems.filter((c) => {
    const chatResult = handleChatCommand(c, chatCommand)
    if (chatResult.isSpecial && chatResult.match.trim()) {
      matchMap.set(chatResult.match, (matchMap.get(chatResult.match) || new Set()).add(c.username))
      userMatchMap.set(c.username, chatResult.match)
    }
    return chatResult.isMatch
  })
  giveawayUserStats.entries = chatCommandEvents.length
  const spamCounts = chatCommandEvents.reduce((acc, u) => {
    acc.set(u.username, (acc.get(u.username) || 0) + 1)
    return acc
  }, new Map<string, number>())
  let users = chatCommandEvents.reduce<ChatItem[]>(
    (acc, c) => (acc.some((i) => i.username === c.username) ? acc : acc.concat(c)),
    []
  )
  giveawayUserStats.users = users.length
  users = users.filter((i) => {
    if (!settings.chatCommand?.trim()) return true
    if (!settings.spamLimit || settings.spamLimit === 1) return true
    const count = spamCounts.get(i.username)
    if (count === undefined) return
    const didSpam = count > settings.spamLimit
    return !didSpam
  })
  const [twitchFollowers, youtubeSubs] = await Promise.all([getFollowers(channelInfo), fakeCache()])
  const filteredFollowers = users.filter((u) => {
    return (u.source === 'twitch' && twitchFollowers?.has(u.username)) || u.source === 'youtube'
  })
  giveawayUserStats.followers = filteredFollowers.length
  if (settings.followersOnly) {
    users = filteredFollowers
  }
  giveawayUserStats.subs = users.filter((u) => isSubscriber(u, youtubeSubs)).length
  users = users.flatMap((c) => {
    if (isSubscriber(c, youtubeSubs)) {
      subCount += 1
      subEntries += settings.subLuck
      return Array.from({ length: settings.subLuck }, () => c)
    }
    return c
  })
  giveawayUserStats.finalEntries = users.length
  giveawayUserStats.toast()
  console.info('[giveaway][chat][end]')
  const winners = Array.from({ length: settings.numberOfWinners }, () => {
    const winner = getRandomArrayItem(users.filter((u) => !pastWinners.has(u.username) && !forfeitSet.has(u.username)))
    if (!winner) return
    pastWinners.add(winner.username)
    announceWinner({
      giveawayType: 'chat',
      chatClient,
      channelInfo,
      settings,
      winner: {
        displayName: winner.displayName,
        username: winner.username,
        platform: winner.source,
      },
      discordSettings,
    })
    return {
      displayName: winner.displayName,
      login: winner.username,
      wasSubscriber: winner.isSubscriber,
      wasFollower: twitchFollowers?.has(winner.username),
      otherUsersWithEntry: [...(matchMap.get(userMatchMap.get(winner.username) || '') || new Set())].filter(
        (u) => u !== winner.username
      ),
      source: 'chat',
      platform: winner.source,
    }
  }).filter(Boolean) as GiveawayResult['winners']
  return {
    winners,
    giveawayStats: giveawayUserStats.data(),
  }
}

// export async function getInstantGiveaway(
//   chatClient: Chat,
//   channelInfo: ChannelInfo,
//   settings: Settings,
//   discordSettings: DiscordSettings,
//   forfeits: string[]
// ): Promise<GiveawayInformation> {
//   const forfeitSet = new Set([...forfeits])
//   const giveawayUserStats = prepareStats()
//   console.info('[giveaway][instant][start]')
//   let viewers = await getViewers(channelInfo)
//   viewers = viewers.filter((u) => !settings.blocklist.map((b) => b.trim()).includes(u))
//   console.info({ viewers: viewers.length })
//   const [followersList, subsList] = await Promise.all([getFollowers(channelInfo), getSubs(channelInfo)])
//   giveawayUserStats.users = viewers.length
//   giveawayUserStats.entries = viewers.length
//   let mappedViewers = viewers.map((v) => ({
//     login: v,
//     follows: followersList!.has(v),
//     isSubscriber: subsList!.has(v),
//     source: 'instant',
//     platform: 'twitch',
//   }))
//   let filteredFollowers = mappedViewers.filter((v) => v.follows)
//   let filteredSubs = mappedViewers.filter((v) => v.isSubscriber)
//   giveawayUserStats.followers = filteredFollowers.length
//   giveawayUserStats.subs = filteredSubs.length
//   if (settings.followersOnly) {
//     mappedViewers = filteredFollowers
//   }
//   viewers = mappedViewers
//     .flatMap((c) => {
//       if (c.isSubscriber) {
//         return Array.from({ length: settings.subLuck }, () => c)
//       }
//       return c
//     })
//     .map((i) => i.login)
//   giveawayUserStats.finalEntries = viewers.length
//   console.info('[giveaway][instant]', giveawayUserStats)
//   giveawayUserStats.toast()
//   console.info('[giveaway][instant][end]')
//   const winners = Array.from({ length: settings.numberOfWinners }, () => {
//     const winner = getRandomArrayItem(
//       mappedViewers.filter((u) => !pastWinners.has(u.login) && !forfeitSet.has(u.login))
//     )
//     if (!winner) return
//     pastWinners.add(winner.login)
//     announceWinner({
//       giveawayType: 'instant',
//       chatClient,
//       channelInfo,
//       settings,
//       winner: winner.login,
//       discordSettings,
//     })
//     return winner.login
//       ? {
//           login: winner.login,
//           wasSubscriber: winner.isSubscriber,
//           wasFollower: winner.follows,
//           platform: winner.platform,
//         }
//       : undefined
//   }).filter(Boolean) as { login: string; wasSubscriber: boolean; wasFollower: boolean }[]
//   return {
//     winners,
//     giveawayStats: giveawayUserStats.data(),
//   }
// }

export interface AnnounceArgs {
  chatClient: Chat
  giveawayType: 'instant' | 'chat'
  channelInfo: ChannelInfo
  settings: Settings
  discordSettings: DiscordSettings
  winner: AnnounceArgsWinner
  force?: boolean
}

export interface AnnounceArgsWinner {
  displayName?: string
  username?: string
  platform: 'twitch' | 'youtube' | undefined
}

export async function announceWinner({
  giveawayType,
  chatClient,
  channelInfo,
  settings,
  discordSettings,
  winner,
  force,
}: AnnounceArgs) {
  let winnerName = winner.displayName || winner.username
  if (!winnerName) return
  let eventWinnerName = winnerName

  if (winner.platform == 'youtube') {
    winnerName += ' (YouTube)'
    eventWinnerName = winnerName
  } else if (winner.platform == 'twitch') {
    eventWinnerName += ' (Twitch)'
  }

  if (force !== true && settings.autoAnnounce !== undefined && settings.autoAnnounce === false) return

  const discordTimerNotAllowed =
    giveawayType === 'chat' &&
    discordSettings.giveawayMinTime &&
    settings.timerDuration &&
    settings.timerDuration < discordSettings.giveawayMinTime
  const colour = getDiscordColour(discordSettings.messageColour)
  const image = await getTwitchThumbnail(channelInfo)
  const eventData = {
    type: 'winner',
    winnerName,
    prize: settings.prize,
    channelId: channelInfo.userId,
    login: channelInfo.login,
    image,
    alertDuration: settings.alertDuration,
    alertTheme: settings.alertTheme,
    alertCustomImageUrl: settings.alertCustomImageUrl,
    discordGuildId: discordSettings.guildId,
    discordChannelId: discordSettings.channelId,
    discordColour: colour,
    discordTitle: discordSettings.winnerTitle,
    discordBody: discordSettings.winnerBody,
    discordEnabled: discordTimerNotAllowed
      ? false
      : discordSettings.winnerEnabled === undefined
      ? true
      : discordSettings.winnerEnabled,
  }
  relay.emit('event', { type: 'timer-hide', hidden: true, channelId: channelInfo.userId, login: channelInfo.login })
  console.info('[relay][event]', eventData)
  relay.emit('event', eventData)
  if (settings.sendMessages && !winner?.username?.includes('|$$|')) {
    chatClient?.say(
      channelInfo.login!,
      `${winner.platform == 'twitch' ? `@${winnerName}` : winnerName} won ${settings.prize || 'the giveaway'}!`
    )
  }
}

// =============================================================================
// BRANIFY WHATSAPP CRM — Inbox (v2, WhatsApp Business-style workspace)
// -----------------------------------------------------------------------------
// The professional inbox implementation lives in ./inbox/*:
//   inbox/InboxSection.tsx     3-pane container (realtime, search, unread)
//   inbox/ConversationList.tsx filters · server-side search · pinned/muted
//   inbox/ChatPane.tsx         paginated history · date separators · divider
//   inbox/Bubble.tsx           all supported message types + actions + ticks
//   inbox/Composer.tsx         emoji · attachments · reply · templates · AI
//   inbox/ProfilePane.tsx      CRM details · notes · conversation actions
//   inbox/EmojiPicker.tsx      local emoji data (no CDN dependency)
// This file keeps the original import path (WhatsAppPage.tsx) stable.
// =============================================================================
export { InboxSection, TemplateSendModal } from './inbox/InboxSectionReexports';

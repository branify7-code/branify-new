// Re-export bridge: keeps WhatsAppPage.tsx imports stable while the inbox v2
// components live under ./inbox/. TemplateSendModal is provided by Composer.
export { InboxSection } from './InboxSection';
export { TemplateSendModal } from './Composer';

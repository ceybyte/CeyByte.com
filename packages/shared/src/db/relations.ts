// Source of truth: docs/05-SCHEMA.md §4.1.
import { relations } from "drizzle-orm";
import * as s from "./schema";

export const usersRelations = relations(s.users, ({ many }) => ({
  merchants: many(s.merchants),
  sessions: many(s.sessions),
  accounts: many(s.accounts),
  tickets: many(s.feedbackTickets),
  donations: many(s.donations, { relationName: "donor" }),
}));

export const merchantsRelations = relations(s.merchants, ({ one, many }) => ({
  owner: one(s.users, { fields: [s.merchants.ownerUserId], references: [s.users.id] }),
  logs: many(s.merchantLogs),
  donations: many(s.donations),
}));

export const merchantLogsRelations = relations(s.merchantLogs, ({ one }) => ({
  merchant: one(s.merchants, { fields: [s.merchantLogs.merchantId], references: [s.merchants.id] }),
  release: one(s.releases, { fields: [s.merchantLogs.releaseId], references: [s.releases.id] }),
}));

export const docsCategoriesRelations = relations(s.docsCategories, ({ one, many }) => ({
  parent: one(s.docsCategories, {
    fields: [s.docsCategories.parentId],
    references: [s.docsCategories.id],
    relationName: "tree",
  }),
  children: many(s.docsCategories, { relationName: "tree" }),
  articles: many(s.docsArticles),
}));

export const docsArticlesRelations = relations(s.docsArticles, ({ one }) => ({
  category: one(s.docsCategories, { fields: [s.docsArticles.categoryId], references: [s.docsCategories.id] }),
  author: one(s.users, { fields: [s.docsArticles.authorId], references: [s.users.id] }),
}));

export const feedbackTicketsRelations = relations(s.feedbackTickets, ({ one, many }) => ({
  votes: many(s.feedbackVotes),
  resolvedIn: one(s.releases, {
    fields: [s.feedbackTickets.resolvedInReleaseId],
    references: [s.releases.id],
  }),
  reporter: one(s.users, { fields: [s.feedbackTickets.reporterUserId], references: [s.users.id] }),
}));

export const donationsRelations = relations(s.donations, ({ one }) => ({
  merchant: one(s.merchants, { fields: [s.donations.merchantId], references: [s.merchants.id] }),
  donor: one(s.users, { fields: [s.donations.userId], references: [s.users.id], relationName: "donor" }),
}));

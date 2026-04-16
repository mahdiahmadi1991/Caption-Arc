import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  getMicrosoftAccessTokenMock,
  requestMicrosoftAccessTokenInteractiveMock,
  clearMicrosoftStoredTokensMock,
} = vi.hoisted(() => ({
  getMicrosoftAccessTokenMock: vi.fn(async () => "microsoft-access-token"),
  requestMicrosoftAccessTokenInteractiveMock: vi.fn(
    async () => "microsoft-access-token"
  ),
  clearMicrosoftStoredTokensMock: vi.fn(async () => undefined),
}));

vi.mock(
  "../../entrypoints/background/cloud-sync/providers/onedrive-auth",
  () => ({
    getMicrosoftAccessToken: getMicrosoftAccessTokenMock,
    requestMicrosoftAccessTokenInteractive:
      requestMicrosoftAccessTokenInteractiveMock,
    clearMicrosoftStoredTokens: clearMicrosoftStoredTokensMock,
  })
);

import {
  connectOneDrive,
  listOneDriveChangedFiles,
  writeOneDriveFile,
} from "../../entrypoints/background/cloud-sync/providers/onedrive";

describe("OneDrive provider contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("ODR-001: connect falls back to drive owner metadata when /me does not return a user profile", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "approot",
            name: "approot",
            folder: { childCount: 0 },
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response("{}", { status: 403 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            owner: {
              user: {
                id: "user-123",
                displayName: "Ada Lovelace",
                email: "ada@example.com",
              },
            },
          }),
          { status: 200 }
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    const checkpoint = await connectOneDrive();

    expect(requestMicrosoftAccessTokenInteractiveMock).toHaveBeenCalledTimes(1);
    expect(checkpoint).toEqual(
      expect.objectContaining({
        provider: "onedrive",
        connected: true,
        accountId: "user-123",
        accountLabel: "ada@example.com",
        healthState: "syncing",
      })
    );
  });

  test("ODR-002: file lookup uses Graph path addressing with the closing colon before query parameters", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("{}", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "saved-item",
            eTag: "etag-1",
            lastModifiedDateTime: "2026-04-16T10:00:00.000Z",
            size: 3,
          }),
          { status: 200 }
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    await writeOneDriveFile("shared.json.enc", new Uint8Array([1, 2, 3]));

    expect(getMicrosoftAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://graph.microsoft.com/v1.0/me/drive/special/approot:/shared.json.enc:?$select=id,name,eTag,lastModifiedDateTime,size,folder",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer microsoft-access-token",
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://graph.microsoft.com/v1.0/me/drive/special/approot:/shared.json.enc:/content",
      expect.objectContaining({
        method: "PUT",
      })
    );
  });

  test("ODR-003: delta listings return vault-relative paths and persist the next cursor", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: [
              {
                id: "item-1",
                name: "meta.json.enc",
                eTag: "etag-1",
                lastModifiedDateTime: "2026-04-16T10:00:00.000Z",
                size: 12,
                parentReference: {
                  path: "/drive/special/approot:/sessions/session-1",
                },
              },
              {
                id: "folder-1",
                name: "session-1",
                folder: { childCount: 3 },
                parentReference: {
                  path: "/drive/special/approot:/sessions",
                },
              },
            ],
            "@odata.deltaLink": "https://graph.microsoft.com/v1.0/me/drive/items/approot/delta?$deltatoken=next",
          }),
          { status: 200 }
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    const listing = await listOneDriveChangedFiles(
      "https://graph.microsoft.com/v1.0/me/drive/items/approot/delta?$deltatoken=prev"
    );

    expect(listing).toEqual({
      files: [
        expect.objectContaining({
          path: "sessions/session-1/meta.json.enc",
          versionToken: "etag-1",
        }),
      ],
      cursor:
        "https://graph.microsoft.com/v1.0/me/drive/items/approot/delta?$deltatoken=next",
    });
  });
});

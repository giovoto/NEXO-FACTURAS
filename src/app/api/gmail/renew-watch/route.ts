
'use server';

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db } from "@/lib/firebase-admin";

// App Hosting: fuerza runtime Node para usar googleapis
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getGmailClient(refreshToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth });
}

export async function GET(_req: NextRequest) {
  const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
     const errorMessage = "La variable de entorno GCLOUD_PROJECT o FIREBASE_PROJECT_ID no está definida.";
     console.error(`[gmail/renew-watch] ${errorMessage}`);
     return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }

  try {
    const snapshot = await db.collection("users").get();
    const results: any[] = [];

    for (const doc of snapshot.docs) {
      const user = doc.data();
      const refreshToken = user?.googleRefreshToken;
      if (!refreshToken) continue;

      try {
        const gmail = await getGmailClient(refreshToken);
        const res = await gmail.users.watch({
          userId: "me",
          requestBody: {
            topicName: `projects/${projectId}/topics/gmail-push`,
            labelIds: ["INBOX"],
            labelFilterAction: "include",
          },
        });

        // Guardamos último historyId en Firestore
        await db.collection("users").doc(doc.id).set(
          {
            googleWatchExpiration: res.data.expiration,
            googleWatchHistoryId: res.data.historyId,
          },
          { merge: true }
        );

        results.push({ uid: doc.id, success: true, historyId: res.data.historyId });
      } catch (e: any) {
        console.error(`❌ Error renovando watch para ${doc.id}`, e.message || e);
        results.push({ uid: doc.id, success: false, error: e.message });
      }
    }

    console.info("🔄 Watch de Gmail renovado para múltiples usuarios", { count: results.length });

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("❌ Error global al renovar watches", err.message || err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

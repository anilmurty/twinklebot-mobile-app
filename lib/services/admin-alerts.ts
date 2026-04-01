/**
 * Admin alert emails via Resend API.
 * Used for QC notifications after story generation.
 */

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

function isConfigured(): boolean {
  return !!(ADMIN_EMAIL && RESEND_API_KEY)
}

async function sendEmail(subject: string, html: string): Promise<void> {
  if (!isConfigured()) {
    console.log(`[ADMIN ALERT] Not configured — skipping: ${subject}`)
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TwinkleBot Alerts <alerts@twinklebot.app>',
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[ADMIN ALERT] Failed to send: ${err}`)
    } else {
      console.log(`[ADMIN ALERT] Sent: ${subject}`)
    }
  } catch (err) {
    console.error(`[ADMIN ALERT] Error:`, err)
  }
}

/**
 * Send a QC email after a storybook is generated, with scene thumbnails
 * and the character reference photo so admin can spot-check.
 */
export async function sendStoryCompletionAlert(opts: {
  storybookId: string
  title: string
  characterName: string
  characterPhotoUrl: string
  style: string
  scenes: { scene_number: number; headline?: string; image_url: string }[]
}): Promise<void> {
  const { storybookId, title, characterName, characterPhotoUrl, style, scenes } = opts

  const sortedScenes = [...scenes].sort((a, b) => a.scene_number - b.scene_number)

  const sceneRows = sortedScenes.map(s => `
    <tr>
      <td style="padding:8px;vertical-align:top;font-size:14px;color:#666;">
        Scene ${s.scene_number}${s.headline ? `<br/><strong>${s.headline}</strong>` : ''}
      </td>
      <td style="padding:8px;">
        <img src="${s.image_url}" alt="Scene ${s.scene_number}" style="width:200px;height:auto;border-radius:8px;" />
      </td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#333;">Story Generated: ${title}</h2>
      <p><strong>Character:</strong> ${characterName}</p>
      <p><strong>Style:</strong> ${style || 'natural'}</p>
      <p><strong>Storybook ID:</strong> <code>${storybookId}</code></p>

      <h3 style="margin-top:24px;">Character Reference</h3>
      <img src="${characterPhotoUrl}" alt="${characterName}" style="width:150px;height:150px;object-fit:cover;border-radius:50%;border:3px solid #ddd;" />

      <h3 style="margin-top:24px;">Generated Scenes (${scenes.length})</h3>
      <p style="color:#888;font-size:12px;">Compare each scene's child against the reference photo above.</p>
      <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        ${sceneRows}
      </table>

      <p style="margin-top:24px;color:#888;font-size:12px;">
        View in app: <a href="https://www.twinklebot.app/storybook/${storybookId}">Open Storybook</a>
      </p>
    </div>
  `

  await sendEmail(
    `[QC] ${title} starring ${characterName} (${style || 'natural'})`,
    html
  )
}

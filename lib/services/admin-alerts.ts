/**
 * Admin alert emails via Resend API.
 * Used for QC notifications and failure alerts.
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

/**
 * Send an alert email when a new user signs up.
 */
export async function sendNewUserAlert(opts: {
  userId: string
  email: string
  createdAt: string
  provider?: string | null
  fullName?: string | null
  ipAddress?: string | null
  country?: string | null
  userAgentSummary?: string | null
}): Promise<void> {
  const {
    userId, email, createdAt,
    provider, fullName, ipAddress, country, userAgentSummary,
  } = opts

  const providerLabel = provider
    ? provider.charAt(0).toUpperCase() + provider.slice(1)
    : 'Unknown'

  const optionalRows = [
    fullName ? `<tr><td style="color:#666;white-space:nowrap;"><strong>Name:</strong></td><td>${fullName}</td></tr>` : '',
    `<tr><td style="color:#666;white-space:nowrap;"><strong>Method:</strong></td><td>${providerLabel}</td></tr>`,
    country ? `<tr><td style="color:#666;white-space:nowrap;"><strong>Country:</strong></td><td>${country}</td></tr>` : '',
    userAgentSummary ? `<tr><td style="color:#666;white-space:nowrap;"><strong>Device:</strong></td><td>${userAgentSummary}</td></tr>` : '',
    ipAddress ? `<tr><td style="color:#666;white-space:nowrap;"><strong>IP:</strong></td><td><code>${ipAddress}</code></td></tr>` : '',
  ].filter(Boolean).join('')

  const html = `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#333;">New Signup</h2>
      <table cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-size:14px;">
        <tr><td style="color:#666;white-space:nowrap;"><strong>Email:</strong></td><td>${email}</td></tr>
        ${optionalRows}
        <tr><td style="color:#666;white-space:nowrap;"><strong>User ID:</strong></td><td><code>${userId}</code></td></tr>
        <tr><td style="color:#666;white-space:nowrap;"><strong>Joined:</strong></td><td>${new Date(createdAt).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</td></tr>
      </table>

      <p style="margin-top:24px;">
        <a href="https://www.twinklebot.app/admin" style="display:inline-block;background:#333;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;">Open Admin Dashboard</a>
      </p>
    </div>
  `

  await sendEmail(`[New Signup ${providerLabel}${country ? ` ${country}` : ''}] ${email}`, html)
}

/**
 * Send an alert email when storybook or preview generation fails.
 * Includes error message, stack trace, and context for debugging.
 */
export async function sendStoryFailureAlert(opts: {
  storybookId: string
  title: string
  characterName: string
  style?: string
  errorMessage: string
  errorStack?: string
  phase: 'preview' | 'full-generation'
  scenesCompleted?: number
  scenesTotal?: number
  durationMs?: number
}): Promise<void> {
  const {
    storybookId, title, characterName, style,
    errorMessage, errorStack, phase,
    scenesCompleted, scenesTotal, durationMs,
  } = opts

  const durationStr = durationMs ? `${(durationMs / 1000).toFixed(1)}s` : 'unknown'
  const sceneInfo = scenesTotal
    ? `${scenesCompleted ?? 0}/${scenesTotal} scenes completed`
    : 'N/A'

  const vercelLogsUrl = `https://vercel.com/twinklebot/twinklebot-mobile-app/logs?search=${encodeURIComponent(storybookId)}`

  const html = `
    <div style="font-family:sans-serif;max-width:600px;">
      <h2 style="color:#cc0000;">Generation Failed: ${title}</h2>
      <table cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-size:14px;">
        <tr><td style="color:#666;white-space:nowrap;"><strong>Phase:</strong></td><td>${phase}</td></tr>
        <tr><td style="color:#666;white-space:nowrap;"><strong>Character:</strong></td><td>${characterName}</td></tr>
        <tr><td style="color:#666;white-space:nowrap;"><strong>Style:</strong></td><td>${style || 'natural'}</td></tr>
        <tr><td style="color:#666;white-space:nowrap;"><strong>Storybook ID:</strong></td><td><code>${storybookId}</code></td></tr>
        <tr><td style="color:#666;white-space:nowrap;"><strong>Duration:</strong></td><td>${durationStr}</td></tr>
        <tr><td style="color:#666;white-space:nowrap;"><strong>Scenes:</strong></td><td>${sceneInfo}</td></tr>
      </table>

      <h3 style="margin-top:24px;color:#cc0000;">Error</h3>
      <pre style="background:#f5f5f5;padding:12px;border-radius:6px;overflow-x:auto;font-size:13px;border:1px solid #ddd;">${errorMessage}</pre>

      ${errorStack ? `
        <h3 style="margin-top:16px;color:#888;">Stack Trace</h3>
        <pre style="background:#f9f9f9;padding:12px;border-radius:6px;overflow-x:auto;font-size:11px;color:#666;border:1px solid #eee;max-height:300px;">${errorStack}</pre>
      ` : ''}

      <p style="margin-top:24px;">
        <a href="${vercelLogsUrl}" style="display:inline-block;background:#333;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;">View Vercel Logs</a>
      </p>

      <p style="margin-top:12px;color:#888;font-size:12px;">
        Timestamp: ${new Date().toISOString()}
      </p>
    </div>
  `

  await sendEmail(
    `[FAILED] ${phase === 'preview' ? 'Preview' : 'Story'}: ${title} starring ${characterName}`,
    html
  )
}

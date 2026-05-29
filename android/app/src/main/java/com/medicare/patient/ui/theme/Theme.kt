package com.medicare.patient.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// ── Brand colours ─────────────────────────────────────────────────────────────
val MedBlue        = Color(0xFF2563EB)
val MedBlueDark    = Color(0xFF1D4ED8)
val MedBlueLight   = Color(0xFFEFF6FF)
val MedPurple      = Color(0xFF7C3AED)
val MedPurpleLight = Color(0xFFF5F3FF)
val MedGreen       = Color(0xFF16A34A)
val MedGreenLight  = Color(0xFFF0FDF4)
val MedOrange      = Color(0xFFEA580C)
val MedOrangeLight = Color(0xFFFFF7ED)
val MedRed         = Color(0xFFDC2626)
val MedRedLight    = Color(0xFFFEF2F2)
val SurfaceGray    = Color(0xFFF8FAFC)
val DividerGray    = Color(0xFFE2E8F0)
val TextPrimary    = Color(0xFF0F172A)
val TextSecondary  = Color(0xFF64748B)
val TextMuted      = Color(0xFF94A3B8)

private val LightColorScheme = lightColorScheme(
    primary          = MedBlue,
    onPrimary        = Color.White,
    primaryContainer = MedBlueLight,
    secondary        = MedPurple,
    onSecondary      = Color.White,
    background       = SurfaceGray,
    surface          = Color.White,
    onBackground     = TextPrimary,
    onSurface        = TextPrimary,
    outline          = DividerGray
)

@Composable
fun MedicareTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography  = Typography(),
        content     = content
    )
}

package com.medicare.patient.ui.exercises

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.medicare.patient.data.model.ExerciseItem
import com.medicare.patient.data.model.UiState
import com.medicare.patient.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExercisesScreen(
    patientId: Long,
    patientName: String,
    viewModel: ExercisesViewModel,
    onLogout: () -> Unit
) {
    val uiState       by viewModel.exercises.collectAsState()
    val dlStates      by viewModel.downloadStates.collectAsState()
    val downloaded    by viewModel.downloaded.collectAsState()
    val arJsonDialog  by viewModel.arJsonDialog.collectAsState()
    val arJsonLoading by viewModel.arJsonLoading.collectAsState()

    // AR JSON dialog
    arJsonDialog?.let { (name, json) ->
        ArJsonDialog(title = name, json = json, onDismiss = { viewModel.dismissArJson() })
    }
    if (arJsonLoading) {
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Loading AR Data…", fontWeight = FontWeight.Bold) },
            text = {
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MedBlue)
                }
            },
            confirmButton = {}
        )
    }

    // Auto-load
    LaunchedEffect(patientId) { viewModel.load(patientId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            "My Exercises",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = Color.White
                        )
                        Text(
                            patientName,
                            fontSize = 12.sp,
                            color = Color.White.copy(alpha = 0.75f)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent
                ),
                actions = {
                    IconButton(onClick = { viewModel.refresh(patientId) }) {
                        Icon(Icons.Default.Refresh, "Refresh", tint = Color.White)
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.AutoMirrored.Filled.Logout, "Logout", tint = Color.White)
                    }
                },
                modifier = Modifier.background(
                    Brush.horizontalGradient(listOf(MedBlue, MedPurple))
                )
            )
        },
        containerColor = SurfaceGray
    ) { padding ->

        when (val state = uiState) {

            is UiState.Loading -> {
                Box(
                    Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        CircularProgressIndicator(color = MedBlue, strokeWidth = 3.dp)
                        Text("Loading your exercises…", color = TextSecondary, fontSize = 14.sp)
                    }
                }
            }

            is UiState.Error -> {
                Box(
                    Modifier.fillMaxSize().padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(Icons.Outlined.ErrorOutline, null, tint = MedRed, modifier = Modifier.size(52.dp))
                        Text(state.message, color = TextSecondary, fontSize = 14.sp)
                        Button(
                            onClick = { viewModel.refresh(patientId) },
                            colors = ButtonDefaults.buttonColors(containerColor = MedBlue)
                        ) {
                            Text("Retry")
                        }
                    }
                }
            }

            is UiState.Success -> {
                val exercises = state.data
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(bottom = 24.dp)
                ) {
                    // ── Hero header ───────────────────────────────────────────
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Brush.horizontalGradient(listOf(MedBlue, MedPurple)))
                                .padding(horizontal = 20.dp, vertical = 20.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column {
                                    Text(
                                        "Published Exercises",
                                        color = Color.White,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        "${exercises.size} exercise${if (exercises.size != 1) "s" else ""} ready for you",
                                        color = Color.White.copy(alpha = 0.75f),
                                        fontSize = 13.sp
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .size(52.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Color.White.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        "${exercises.size}",
                                        color = Color.White,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }
                            }
                        }
                    }

                    // ── Stats row ─────────────────────────────────────────────
                    if (exercises.isNotEmpty()) {
                        item {
                            val doneCount = downloaded.size
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                StatChip(
                                    icon = Icons.Outlined.DownloadDone,
                                    label = "$doneCount Downloaded",
                                    color = MedGreen,
                                    bg = MedGreenLight,
                                    modifier = Modifier.weight(1f)
                                )
                                StatChip(
                                    icon = Icons.Outlined.FitnessCenter,
                                    label = "${exercises.size} Total",
                                    color = MedBlue,
                                    bg = MedBlueLight,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    // ── Empty state ───────────────────────────────────────────
                    if (exercises.isEmpty()) {
                        item {
                            Box(
                                Modifier.fillMaxWidth().padding(top = 80.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Icon(
                                        Icons.Outlined.FitnessCenter,
                                        null,
                                        tint = TextMuted,
                                        modifier = Modifier.size(64.dp)
                                    )
                                    Text("No published exercises yet", color = TextSecondary, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                                    Text(
                                        "Your therapist will publish exercises\nfor your programme soon.",
                                        color = TextMuted,
                                        fontSize = 13.sp,
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                    )
                                }
                            }
                        }
                    }

                    // ── Exercise cards ────────────────────────────────────────
                    itemsIndexed(exercises) { _, exercise ->
                        ExerciseCard(
                            exercise = exercise,
                            isDownloaded = downloaded.contains(exercise.id),
                            isDownloading = dlStates[exercise.id] == true,
                            onDownload = { viewModel.downloadExercise(exercise.id) },
                            onViewJson = if (exercise.arJsonUrl != null) ({ viewModel.viewArJson(exercise) }) else null,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            else -> Unit
        }
    }
}

// ── Exercise card ─────────────────────────────────────────────────────────────

@Composable
private fun ExerciseCard(
    exercise: ExerciseItem,
    isDownloaded: Boolean,
    isDownloading: Boolean,
    onDownload: () -> Unit,
    onViewJson: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val accentColor = when (exercise.difficulty) {
        "HARD"   -> MedRed
        "MEDIUM" -> MedOrange
        else     -> MedGreen
    }
    val accentLight = when (exercise.difficulty) {
        "HARD"   -> MedRedLight
        "MEDIUM" -> MedOrangeLight
        else     -> MedGreenLight
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(Modifier.fillMaxWidth()) {
            // Left accent bar
            Box(
                modifier = Modifier
                    .width(5.dp)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(topStart = 20.dp, bottomStart = 20.dp))
                    .background(accentColor)
            )

            Column(modifier = Modifier.padding(16.dp).weight(1f)) {

                // Row 1: Title + Level badge
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Exercise icon
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(MedBlueLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Outlined.FitnessCenter,
                            contentDescription = null,
                            tint = MedBlue,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Spacer(Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            exercise.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = TextPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(top = 3.dp)
                        ) {
                            // Body part chip
                            MiniChip(
                                label = exercise.bodyPart,
                                color = MedBlue,
                                bg = MedBlueLight
                            )
                            // Level chip
                            MiniChip(
                                label = exercise.level,
                                color = accentColor,
                                bg = accentLight
                            )
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))
                HorizontalDivider(color = DividerGray, thickness = 0.8.dp)
                Spacer(Modifier.height(10.dp))

                // Row 2: Detail info
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    exercise.duration?.let {
                        InfoPill(Icons.Outlined.Timer, it)
                    }
                    if (exercise.sets != null && exercise.reps != null) {
                        InfoPill(Icons.Outlined.Repeat, "${exercise.sets}×${exercise.reps} reps")
                    }
                    exercise.frequency?.let {
                        InfoPill(Icons.Outlined.EventRepeat, it)
                    }
                }

                if (exercise.developer.isNotBlank()) {
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Person, null, tint = TextMuted, modifier = Modifier.size(13.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(exercise.developer, fontSize = 11.sp, color = TextMuted)
                    }
                }

                exercise.updatedAt?.let { rawTs ->
                    Spacer(Modifier.height(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Update, null, tint = TextMuted, modifier = Modifier.size(13.dp))
                        Spacer(Modifier.width(4.dp))
                        Column {
                            Text(
                                "Last Updated",
                                fontSize = 10.sp,
                                color = TextMuted
                            )
                            Text(
                                formatUpdatedAt(rawTs),
                                fontSize = 11.sp,
                                color = TextPrimary,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))

                // Row 3: Download button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Price tag
                    if (exercise.price > 0) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.CurrencyRupee, null, tint = MedGreen, modifier = Modifier.size(14.dp))
                            Text(
                                "${exercise.price}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = MedGreen
                            )
                        }
                    } else {
                        Spacer(Modifier.width(1.dp))
                    }

                    // Buttons row: View JSON (if available) + Download
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // View AR JSON button — only shown when arJsonUrl exists
                        if (onViewJson != null) {
                            OutlinedButton(
                                onClick = onViewJson,
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                                border = BorderStroke(1.dp, MedPurple),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = MedPurple)
                            ) {
                                Icon(Icons.Default.Visibility, null, modifier = Modifier.size(15.dp))
                                Spacer(Modifier.width(5.dp))
                                Text("View", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }

                    // Download / Downloaded button
                    when {
                        isDownloaded -> {
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(MedGreenLight)
                                    .padding(horizontal = 14.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(Icons.Default.CheckCircle, null, tint = MedGreen, modifier = Modifier.size(16.dp))
                                Text("Downloaded", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = MedGreen)
                            }
                        }

                        isDownloading -> {
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(MedBlueLight)
                                    .padding(horizontal = 14.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(14.dp),
                                    color = MedBlue,
                                    strokeWidth = 2.dp
                                )
                                Text("Downloading…", fontSize = 13.sp, color = MedBlue, fontWeight = FontWeight.Medium)
                            }
                        }

                        else -> {
                            Button(
                                onClick = onDownload,
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MedBlue)
                            ) {
                                Icon(Icons.Default.Download, null, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Download", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                    } // end buttons Row
                }
            }
        }
    }
}

// ── AR JSON viewer dialog ─────────────────────────────────────────────────────

@Composable
private fun ArJsonDialog(title: String, json: String, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text("AR Exercise Data", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(title, fontSize = 12.sp, color = Color.Gray)
            }
        },
        text = {
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = Color(0xFF0F172A),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(320.dp)
            ) {
                Box(
                    modifier = Modifier
                        .verticalScroll(rememberScrollState())
                        .padding(12.dp)
                ) {
                    Text(
                        text = json,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        lineHeight = 16.sp,
                        color = Color(0xFF4ADE80)
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Close", color = MedBlue) }
        },
        shape = RoundedCornerShape(16.dp)
    )
}

// ── Small components ──────────────────────────────────────────────────────────

@Composable
private fun MiniChip(label: String, color: Color, bg: Color) {
    Text(
        text = label,
        fontSize = 10.sp,
        fontWeight = FontWeight.SemiBold,
        color = color,
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bg)
            .padding(horizontal = 7.dp, vertical = 3.dp)
    )
}

@Composable
private fun InfoPill(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = TextMuted, modifier = Modifier.size(13.dp))
        Spacer(Modifier.width(3.dp))
        Text(text, fontSize = 11.sp, color = TextSecondary)
    }
}

private fun formatUpdatedAt(raw: String): String {
    val patterns = listOf(
        "yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS",
        "yyyy-MM-dd'T'HH:mm:ss.SSSSSS",
        "yyyy-MM-dd'T'HH:mm:ss.SSS",
        "yyyy-MM-dd'T'HH:mm:ss",
        "yyyy-MM-dd'T'HH:mm"
    )
    val out = java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm:ss a")
    for (pattern in patterns) {
        try {
            val dt = java.time.LocalDateTime.parse(
                raw, java.time.format.DateTimeFormatter.ofPattern(pattern)
            )
            return dt.format(out)
        } catch (_: Exception) { }
    }
    return raw
}

@Composable
private fun StatChip(
    icon: ImageVector,
    label: String,
    color: Color,
    bg: Color,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Icon(icon, null, tint = color, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = color)
    }
}

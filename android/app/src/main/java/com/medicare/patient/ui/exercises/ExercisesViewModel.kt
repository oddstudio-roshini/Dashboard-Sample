package com.medicare.patient.ui.exercises

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medicare.patient.data.model.ExerciseItem
import com.medicare.patient.data.model.UiState
import com.medicare.patient.data.repository.MedicareRepository
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

class ExercisesViewModel(private val repository: MedicareRepository) : ViewModel() {

    private val _exercises = MutableStateFlow<UiState<List<ExerciseItem>>>(UiState.Loading)
    val exercises: StateFlow<UiState<List<ExerciseItem>>> = _exercises

    // Map of exerciseId → download state: true = downloading
    private val _downloadStates = MutableStateFlow<Map<Long, Boolean>>(emptyMap())
    val downloadStates: StateFlow<Map<Long, Boolean>> = _downloadStates

    // Set of downloaded exercise IDs (from Room)
    private val _downloaded = MutableStateFlow<Set<Long>>(emptySet())
    val downloaded: StateFlow<Set<Long>> = _downloaded

    // AR JSON viewer: holds (exerciseName, jsonString) when dialog is open, null when closed
    private val _arJsonDialog = MutableStateFlow<Pair<String, String>?>(null)
    val arJsonDialog: StateFlow<Pair<String, String>?> = _arJsonDialog

    private val _arJsonLoading = MutableStateFlow(false)
    val arJsonLoading: StateFlow<Boolean> = _arJsonLoading

    private var pollingJob: Job? = null
    private var currentPatientId: Long = -1L

    // ── Public API ────────────────────────────────────────────────────────────

    fun load(patientId: Long) {
        currentPatientId = patientId
        // Initial load shows spinner
        viewModelScope.launch { fetchExercises(patientId, showLoading = true) }
        startPolling(patientId)
    }

    fun refresh(patientId: Long) {
        viewModelScope.launch { fetchExercises(patientId, showLoading = false) }
    }

    fun viewArJson(exercise: ExerciseItem) {
        val url = exercise.arJsonUrl ?: return
        viewModelScope.launch {
            _arJsonLoading.value = true
            val result = repository.fetchArJson(url)
            _arJsonLoading.value = false
            result.onSuccess { json ->
                _arJsonDialog.value = exercise.name to json
            }.onFailure {
                _arJsonDialog.value = exercise.name to "{ \"error\": \"Failed to load AR data\" }"
            }
        }
    }

    fun dismissArJson() { _arJsonDialog.value = null }

    fun downloadExercise(exerciseId: Long) {
        if (_downloaded.value.contains(exerciseId)) return
        if (_downloadStates.value[exerciseId] == true) return

        viewModelScope.launch {
            _downloadStates.value = _downloadStates.value + (exerciseId to true)
            val result = repository.downloadExercise(exerciseId)
            _downloadStates.value = _downloadStates.value - exerciseId
            if (result.isSuccess) {
                _downloaded.value = _downloaded.value + exerciseId
            }
        }
    }

    // ── Polling ───────────────────────────────────────────────────────────────

    private fun startPolling(patientId: Long) {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                delay(30_000L)  // wait 30 seconds between polls
                fetchExercises(patientId, showLoading = false)
            }
        }
    }

    // ── Internal fetch ────────────────────────────────────────────────────────

    private suspend fun fetchExercises(patientId: Long, showLoading: Boolean) {
        if (showLoading) _exercises.value = UiState.Loading

        val result = repository.getExercises(patientId)

        result.onSuccess { list ->
            _exercises.value = UiState.Success(list)

            val serverIds = list.map { it.id }

            // Remove locally downloaded exercises deleted from the server
            repository.removeDeletedExercises(serverIds)

            // Refresh downloaded set (some may have been removed above)
            _downloaded.value = serverIds.filter { repository.isDownloaded(it) }.toSet()
        }.onFailure { error ->
            // On polling failure, keep existing data — don't wipe the screen
            if (showLoading) {
                _exercises.value = UiState.Error(error.message ?: "Failed to load exercises")
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}

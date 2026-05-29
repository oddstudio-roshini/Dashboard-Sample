package com.medicare.patient.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.medicare.patient.data.model.LoginResponse
import com.medicare.patient.data.model.UiState
import com.medicare.patient.data.repository.MedicareRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class LoginViewModel(private val repository: MedicareRepository) : ViewModel() {

    private val _state = MutableStateFlow<UiState<LoginResponse>>(UiState.Idle)
    val state: StateFlow<UiState<LoginResponse>> = _state

    fun login(patientIdText: String, password: String) {
        val patientId = patientIdText.toLongOrNull()
        if (patientId == null) {
            _state.value = UiState.Error("Please enter a valid Patient ID")
            return
        }
        if (password.isBlank()) {
            _state.value = UiState.Error("Please enter your password")
            return
        }

        viewModelScope.launch {
            _state.value = UiState.Loading
            val result = repository.login(patientId, password)
            _state.value = result.fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Login failed") }
            )
        }
    }

    fun resetState() { _state.value = UiState.Idle }
}

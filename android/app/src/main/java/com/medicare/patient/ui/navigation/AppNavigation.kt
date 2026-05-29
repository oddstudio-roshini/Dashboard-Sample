package com.medicare.patient.ui.navigation

import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.medicare.patient.data.local.AppDatabase
import com.medicare.patient.data.repository.MedicareRepository
import com.medicare.patient.ui.exercises.ExercisesScreen
import com.medicare.patient.ui.exercises.ExercisesViewModel
import com.medicare.patient.ui.login.LoginScreen
import com.medicare.patient.ui.login.LoginViewModel
import com.medicare.patient.utils.PrefsManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

private object Routes {
    const val LOGIN     = "login"
    const val EXERCISES = "exercises/{patientId}/{patientName}"

    fun exercises(patientId: Long, patientName: String) =
        "exercises/$patientId/${patientName.replace(" ", "_")}"
}

@Composable
fun AppNavigation(prefs: PrefsManager, db: AppDatabase) {
    val navController = rememberNavController()
    val repository    = remember { MedicareRepository(db) }
    val scope         = rememberCoroutineScope()

    NavHost(navController = navController, startDestination = Routes.LOGIN) {

        // ── Login ──────────────────────────────────────────────────────────
        composable(Routes.LOGIN) {
            val vm: LoginViewModel = viewModel(
                factory = object : androidx.lifecycle.ViewModelProvider.Factory {
                    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                        @Suppress("UNCHECKED_CAST")
                        return LoginViewModel(repository) as T
                    }
                }
            )
            LoginScreen(
                viewModel = vm,
                onLoginSuccess = { resp ->
                    scope.launch {
                        prefs.saveSession(resp.token, resp.patientId, resp.patientName)
                    }
                    navController.navigate(Routes.exercises(resp.patientId, resp.patientName)) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        // ── Exercises ─────────────────────────────────────────────────────
        composable(
            route = Routes.EXERCISES,
            arguments = listOf(
                navArgument("patientId")   { type = NavType.LongType },
                navArgument("patientName") { type = NavType.StringType }
            )
        ) { back ->
            val patientId   = back.arguments?.getLong("patientId") ?: 0L
            val patientName = (back.arguments?.getString("patientName") ?: "").replace("_", " ")

            val vm: ExercisesViewModel = viewModel(
                factory = object : androidx.lifecycle.ViewModelProvider.Factory {
                    override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                        @Suppress("UNCHECKED_CAST")
                        return ExercisesViewModel(repository) as T
                    }
                }
            )
            ExercisesScreen(
                patientId   = patientId,
                patientName = patientName,
                viewModel   = vm,
                onLogout    = {
                    scope.launch { prefs.clearSession() }
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}

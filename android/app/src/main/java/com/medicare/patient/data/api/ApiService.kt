package com.medicare.patient.data.api

import com.medicare.patient.data.model.ExerciseDownload
import com.medicare.patient.data.model.ExerciseItem
import com.medicare.patient.data.model.LoginRequest
import com.medicare.patient.data.model.LoginResponse
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    /** POST /api/mobile/login */
    @POST("api/mobile/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    /** GET /api/mobile/patients/{patientId}/exercises */
    @GET("api/mobile/patients/{patientId}/exercises")
    suspend fun getExercises(
        @Path("patientId") patientId: Long
    ): Response<List<ExerciseItem>>

    /** GET /api/mobile/exercises/{exerciseId}/download */
    @GET("api/mobile/exercises/{exerciseId}/download")
    suspend fun downloadExercise(
        @Path("exerciseId") exerciseId: Long
    ): Response<ExerciseDownload>
}

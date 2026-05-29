package com.medicare.patient.data.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    // ── URL options ──────────────────────────────────────────────────────────
    // Android Emulator  →  http://10.0.2.2:8081/          (points to PC localhost)
    // Physical device   →  http://192.168.x.x:8081/       (your PC's LAN IP)
    //                      run `ipconfig` on Windows to find it
    // Android Emulator  →  http://10.0.2.2:8081/
    // Physical device   →  http://192.168.x.x:8081/   ← replace with YOUR PC's IP from ipconfig
    private const val BASE_URL = "http://192.168.0.12:8081/"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    val apiService: ApiService = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(ApiService::class.java)
}

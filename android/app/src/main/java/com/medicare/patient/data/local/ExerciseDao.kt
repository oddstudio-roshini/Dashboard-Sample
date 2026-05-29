package com.medicare.patient.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ExerciseDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(exercise: ExerciseEntity)

    @Query("SELECT * FROM downloaded_exercises ORDER BY downloadedAt DESC")
    fun getAllDownloaded(): Flow<List<ExerciseEntity>>

    @Query("SELECT EXISTS(SELECT 1 FROM downloaded_exercises WHERE exerciseId = :id)")
    suspend fun isDownloaded(id: Long): Boolean

    @Query("DELETE FROM downloaded_exercises WHERE exerciseId = :id")
    suspend fun delete(id: Long)

    @Query("SELECT exerciseId FROM downloaded_exercises")
    suspend fun getAllDownloadedIds(): List<Long>
}

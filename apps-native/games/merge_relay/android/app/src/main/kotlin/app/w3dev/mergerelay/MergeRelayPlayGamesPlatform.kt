package app.w3dev.mergerelay

import android.app.Activity
import android.content.Context
import android.content.Intent
import com.google.android.gms.games.PlayGames
import com.google.android.gms.games.PlayGamesSdk
import com.google.android.gms.tasks.Task

interface MergeRelayPlayGamesTask<T> {
    val isSuccessful: Boolean
    val result: T?
    val exception: Exception?

    fun addOnCompleteListener(listener: (MergeRelayPlayGamesTask<T>) -> Unit)
}

interface MergeRelayPlayGamesSdk {
    fun initialize(context: Context)
    fun authenticationTask(): MergeRelayPlayGamesTask<Boolean>
    fun signInTask(): MergeRelayPlayGamesTask<Boolean>
    fun serverAccessTask(
        serverClientId: String,
        forceRefreshToken: Boolean,
    ): MergeRelayPlayGamesTask<String>

    fun achievementsIntentTask(): MergeRelayPlayGamesTask<Intent>
    fun leaderboardIntentTask(leaderboardId: String): MergeRelayPlayGamesTask<Intent>
}

fun interface MergeRelayPlayGamesActivityHost {
    fun startActivityForResult(intent: Intent, requestCode: Int)
}

class AndroidMergeRelayPlayGamesSdk(private val activity: Activity) : MergeRelayPlayGamesSdk {
    override fun initialize(context: Context) {
        PlayGamesSdk.initialize(context)
    }

    override fun authenticationTask(): MergeRelayPlayGamesTask<Boolean> =
        MappedGoogleTask(PlayGames.getGamesSignInClient(activity).isAuthenticated) {
            it?.isAuthenticated == true
        }

    override fun signInTask(): MergeRelayPlayGamesTask<Boolean> =
        MappedGoogleTask(PlayGames.getGamesSignInClient(activity).signIn()) {
            it?.isAuthenticated == true
        }

    override fun serverAccessTask(
        serverClientId: String,
        forceRefreshToken: Boolean,
    ): MergeRelayPlayGamesTask<String> = MappedGoogleTask(
        PlayGames.getGamesSignInClient(activity)
            .requestServerSideAccess(serverClientId, forceRefreshToken),
    ) { it }

    override fun achievementsIntentTask(): MergeRelayPlayGamesTask<Intent> =
        GoogleTask(PlayGames.getAchievementsClient(activity).getAchievementsIntent())

    override fun leaderboardIntentTask(leaderboardId: String): MergeRelayPlayGamesTask<Intent> = GoogleTask(
        PlayGames.getLeaderboardsClient(activity).getLeaderboardIntent(leaderboardId),
    )
}

private class GoogleTask<T>(private val task: Task<T>) : MergeRelayPlayGamesTask<T> {
    override val isSuccessful: Boolean
        get() = task.isSuccessful

    override val result: T?
        get() = if (task.isSuccessful) task.result else null

    override val exception: Exception?
        get() = task.exception

    override fun addOnCompleteListener(listener: (MergeRelayPlayGamesTask<T>) -> Unit) {
        task.addOnCompleteListener { listener(this) }
    }
}

private class MappedGoogleTask<I, O>(
    private val task: Task<I>,
    private val mapper: (I?) -> O?,
) : MergeRelayPlayGamesTask<O> {
    override val isSuccessful: Boolean
        get() = task.isSuccessful

    override val result: O?
        get() = if (task.isSuccessful) mapper(task.result) else null

    override val exception: Exception?
        get() = task.exception

    override fun addOnCompleteListener(listener: (MergeRelayPlayGamesTask<O>) -> Unit) {
        task.addOnCompleteListener { listener(this) }
    }
}

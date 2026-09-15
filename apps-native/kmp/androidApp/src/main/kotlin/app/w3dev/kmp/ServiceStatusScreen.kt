package app.w3dev.kmp

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ServiceStatusScreen(
    state: ServiceStatusUiState,
    onRetry: () -> Unit,
) {
    Scaffold { paddingValues: PaddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Service Status", style = MaterialTheme.typography.headlineMedium)
            when {
                state.isLoading -> CircularProgressIndicator()
                state.serviceStatus != null -> {
                    Text("Status: ${state.serviceStatus.status}")
                    Text("Timestamp: ${state.serviceStatus.timestamp}")
                    Button(onClick = onRetry) { Text("Refresh") }
                }
                state.errorMessage != null -> {
                    Text(state.errorMessage, color = MaterialTheme.colorScheme.error)
                    Button(onClick = onRetry) { Text("Retry") }
                }
            }
        }
    }
}

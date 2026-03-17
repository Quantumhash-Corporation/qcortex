package ai.qcortex.app.ui

import androidx.compose.runtime.Composable
import ai.qcortex.app.MainViewModel
import ai.qcortex.app.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}

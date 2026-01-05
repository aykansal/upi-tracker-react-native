package expo.modules.upiapplauncher

import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class ExpoUpiAppLauncherModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoUpiAppLauncher")

    Function("shareTo") { packageName: String, uri: String ->
      val context = appContext.reactContext ?: return@Function
      val applicationContext = context.applicationContext

      // Parse the URI
      val parsedUri = Uri.parse(uri)
      val finalUri: Uri = when {
        // Convert file:// URIs to content:// URIs using FileProvider
        parsedUri.scheme == "file" -> {
          try {
            val file = File(parsedUri.path ?: return@Function)
            if (!file.exists()) {
              return@Function
            }
            
            // Use FileProvider to get content URI
            // Authority format: {packageName}.fileprovider
            val authority = "${applicationContext.packageName}.fileprovider"
            FileProvider.getUriForFile(applicationContext, authority, file)
          } catch (e: Exception) {
            // If FileProvider fails, fall back to original URI
            parsedUri
          }
        }
        else -> {
          // Already a content:// URI or other scheme
          parsedUri
        }
      }

      val intent = Intent(Intent.ACTION_SEND).apply {
        type = "image/*"
        putExtra(Intent.EXTRA_STREAM, finalUri)
        setPackage(packageName)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }
  }
}

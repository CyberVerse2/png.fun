import { supabase } from './supabase'

/**
 * Upload a photo to Supabase Storage
 * @param file - The file to upload (base64 data URL or File object)
 * @param userId - The user ID for organizing uploads
 * @returns The public URL of the uploaded photo
 */
export async function uploadPhoto(
  file: string | File,
  userId: string
): Promise<string> {
  try {
    let fileToUpload: File | Blob

    // Convert base64 data URL to Blob if needed
    if (typeof file === 'string' && file.startsWith('data:')) {
      const response = await fetch(file)
      fileToUpload = await response.blob()
    } else if (file instanceof File) {
      fileToUpload = file
    } else {
      throw new Error('Invalid file format')
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const filename = `${userId}/${timestamp}-${randomString}.jpg`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(filename, fileToUpload, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw error
  }
}

/**
 * Delete a photo from Supabase Storage
 * @param photoUrl - The public URL of the photo to delete
 */
export async function deletePhoto(photoUrl: string): Promise<void> {
  try {
    // Extract path from URL
    const url = new URL(photoUrl)
    const path = url.pathname.split('/photos/')[1]

    if (!path) {
      throw new Error('Invalid photo URL')
    }

    const { error } = await supabase.storage.from('photos').remove([path])

    if (error) {
      console.error('Delete error:', error)
      throw error
    }
  } catch (error) {
    console.error('Error deleting photo:', error)
    throw error
  }
}

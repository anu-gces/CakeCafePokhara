import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firestore'

export type Vendor = {
  nickname: string
  firstName: string
  lastName: string
  remarks?: string
}

export async function addVendorToFirestore(vendor: Vendor) {
  const docRef = await addDoc(collection(db, 'vendors'), vendor)
  return docRef.id
}

export async function getAllVendors(): Promise<(Vendor & { id: string })[]> {
  const vendorsRef = collection(db, 'vendors')
  const querySnapshot = await getDocs(vendorsRef)
  const vendors = querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id, // <-- include Firestore doc ID
        ...doc.data(),
      }) as Vendor & { id: string },
  )
  return vendors
}

export async function updateVendor(vendorId: string, updatedVendor: Vendor) {
  const vendorRef = doc(db, 'vendors', vendorId)
  try {
    await updateDoc(vendorRef, updatedVendor)
  } catch (error) {
    throw new Error('Failed to update vendor')
  }
}

export async function deleteVendor(vendorId: string) {
  const vendorRef = doc(db, 'vendors', vendorId)
  try {
    await deleteDoc(vendorRef)
  } catch (error) {
    throw new Error('Failed to delete vendor')
  }
}

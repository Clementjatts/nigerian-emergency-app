import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../services/api';

const ContactContext = createContext({});

export const ContactProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedContacts = await api.getContacts();
      setContacts(fetchedContacts);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addContact = async (contactData) => {
    try {
      setLoading(true);
      setError(null);
      const newContact = await api.addContact(contactData);
      setContacts(prevContacts => [...prevContacts, newContact]);
      return newContact;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (contactId, contactData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedContact = await api.updateContact(contactId, contactData);
      setContacts(prevContacts =>
        prevContacts.map(contact =>
          contact._id === contactId ? updatedContact : contact
        )
      );
      return updatedContact;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (contactId) => {
    try {
      setLoading(true);
      setError(null);
      await api.deleteContact(contactId);
      setContacts(prevContacts =>
        prevContacts.filter(contact => contact._id !== contactId)
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContactContext.Provider
      value={{
        contacts,
        loading,
        error,
        fetchContacts,
        addContact,
        updateContact,
        deleteContact,
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactProvider');
  }
  return context;
};

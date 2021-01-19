package com.mobi.preference.impl;

/*-
 * #%L
 * com.mobi.preference.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.notification.impl.SimpleNotificationService;
import com.mobi.notification.impl.ontologies.EmailNotificationPreference;
import com.mobi.preference.api.PreferenceService;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.preference.api.ontologies.Prefix;
import com.mobi.preference.api.ontologies.PrefixPreference;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;

import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

public class SimplePreferenceServiceTest extends OrmEnabledTestCase {

    private Repository repo;
    private SimplePreferenceService service;
    private SimpleNotificationService notificationService;
    private OrmFactory<Preference> preferenceFactory = getRequiredOrmFactory(Preference.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

    private IRI simplePreferenceIRI;
    private IRI complexPreferenceIRI;

    @Mock
    private OrmFactoryRegistry registry;


    private interface TestComplexPreference extends Thing, Preference {
        String TYPE = "http://example.com/ExampleComplexPreference";
    }

    static abstract class TestComplexPreferenceImpl implements TestComplexPreference, Thing, Preference {

    }

    private interface TestSimplePreference extends Thing, Preference {
        String TYPE = "http://example.com/ExampleSimplePreference";
    }

    static abstract class TestSimplePreferenceImpl implements TestSimplePreference, Thing, Preference {

    }

    @Mock
    private OrmFactory<TestComplexPreference> testComplexPreferenceFactory;

    @Mock
    private OrmFactory<TestComplexPreference> testSimplePreferenceFactory;

    @Mock
    private CatalogConfigProvider configProvider;


    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        simplePreferenceIRI = VALUE_FACTORY.createIRI("http://example.com/MySimplePreference");
        complexPreferenceIRI = VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference");

        MockitoAnnotations.initMocks(this);

        when(registry.getFactoriesOfType(User.class)).thenReturn(Collections.singletonList(userFactory));
        when(testComplexPreferenceFactory.getTypeIRI()).thenReturn(VALUE_FACTORY.createIRI(TestComplexPreference.TYPE));
        when(testSimplePreferenceFactory.getTypeIRI()).thenReturn(VALUE_FACTORY.createIRI(TestSimplePreference.TYPE));
        when(registry.getSortedFactoriesOfType(Preference.class)).thenReturn(Arrays.asList(testComplexPreferenceFactory, testSimplePreferenceFactory, preferenceFactory));

        when(configProvider.getRepository()).thenReturn(repo);

        service = new SimplePreferenceService();
        injectOrmFactoryReferencesIntoService(service);
        notificationService = new SimpleNotificationService();
        injectOrmFactoryReferencesIntoService(notificationService);
        service.vf =  VALUE_FACTORY;
        service.mf = MODEL_FACTORY;
        service.configProvider = configProvider;
        service.factoryRegistry = registry;
        service.start();
    }

    @Test
    public void addPreferenceWithObjectValueTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }


    @Test
    public void addPreferenceWithDataValueTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void addPreferenceWithExistingPreferenceTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"), testDataModel).get();
        repo.getConnection().add(preference.getModel(), VALUE_FACTORY.createIRI(PreferenceService.GRAPH));

        service.addPreference(user, preference);
    }


    @Test(expected = IllegalArgumentException.class)
    public void addPreferenceWithExistingPreferenceTypeTest() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"), testDataModel).get();

        service.addPreference(user, preference);

        InputStream secondInputStream = getClass().getResourceAsStream("/altSimplePreference.ttl");
        Model secondTestDataModel = Values.mobiModel(Rio.parse(secondInputStream, "", RDFFormat.TURTLE));
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/AltSimplePreference"), secondTestDataModel).get();

        service.addPreference(user, secondPreference);
    }

    // TODO: Add test where it prevents user injection


    @Test
    public void validatePreferenceTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference"), testDataModel).get();

        service.validatePreference(preference); // Should not throw exception
    }

    @Test(expected = IllegalArgumentException.class)
    public void validatePreferenceWithoutReferenceTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/complexPreferenceMissingReference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference"), testDataModel).get();

        service.validatePreference(preference);
    }

    @Test(expected = IllegalArgumentException.class)
    public void validatePreferenceWithoutValueTest() throws Exception {
        InputStream inputStream = getClass().getResourceAsStream("/preferenceNoValue.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference"), testDataModel).get();

        service.validatePreference(preference);
    }

    @Test
    public void getUserPreferenceTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference preference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, preference);
        try (RepositoryConnection conn = repo.getConnection()) {
            preference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }

        Preference retrievedPreference = service.getUserPreference(user, VALUE_FACTORY.createIRI(TestComplexPreference.TYPE)).get();
        Model retrievedPreferenceModel = retrievedPreference.getModel();
        assertTrue(retrievedPreferenceModel.contains(complexPreferenceIRI, VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource()));

        preference.getModel().forEach(statement -> assertTrue(retrievedPreference.getModel().contains(statement)));
    }

    @Test
    public void getUserPreferenceThatDoesNotExistTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        Optional<Preference> retrievedPreference = service.getUserPreference(user, VALUE_FACTORY.createIRI(EmailNotificationPreference.TYPE));
        assertFalse(retrievedPreference.isPresent());
    }

    // TODO: test for Preference when multiple preferences of the same type exist in the repo. Assert RepositoryException

    @Test
    public void getUserPreferencesTest() throws Exception {
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com/user"));
        InputStream inputStream = getClass().getResourceAsStream("/complexPreference.ttl");
        Model testDataModel = Values.mobiModel(Rio.parse(inputStream, "", RDFFormat.TURTLE));
        Preference firstPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/MyComplexPreference"), testDataModel).get();

        service.addPreference(user, firstPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            firstPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }

        InputStream secondInputStream = getClass().getResourceAsStream("/simplePreference.ttl");
        Model secondTestModel = Values.mobiModel(Rio.parse(secondInputStream, "", RDFFormat.TURTLE));
        Preference secondPreference = preferenceFactory.getExisting(VALUE_FACTORY.createIRI("http://example.com/MySimplePreference"), secondTestModel).get();

        service.addPreference(user, secondPreference);
        try (RepositoryConnection conn = repo.getConnection()) {
            secondPreference.getModel().forEach(statement -> assertTrue(conn.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }

        service.getUserPreferences(user);

        Set<Preference> retrievedPreferences = service.getUserPreferences(user);
        Model retrievedPreferencesModel = MODEL_FACTORY.createModel();
        retrievedPreferences.forEach(retrievedPreference -> {
            retrievedPreferencesModel.addAll(retrievedPreference.getModel());
        });

        assertTrue(retrievedPreferencesModel.contains(simplePreferenceIRI, VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource()));
        assertTrue(retrievedPreferencesModel.contains(complexPreferenceIRI, VALUE_FACTORY.createIRI(Preference.forUser_IRI),
                user.getResource()));

        Model combinedModel = MODEL_FACTORY.createModel();
        combinedModel.addAll(firstPreference.getModel());
        combinedModel.addAll(secondPreference.getModel());
        combinedModel.forEach(statement -> assertTrue(retrievedPreferencesModel.contains(statement)));
    }
}
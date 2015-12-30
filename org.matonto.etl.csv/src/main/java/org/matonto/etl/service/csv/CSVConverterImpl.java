package org.matonto.etl.service.csv;

import org.apache.log4j.Logger;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.opencsv.CSVReader;
import org.matonto.etl.api.csv.CSVConverter;
import org.matonto.etl.api.rdf.RDFExportService;
import org.matonto.etl.api.rdf.RDFImportService;
import org.matonto.persistence.utils.Models;
import org.matonto.rdf.api.*;
import org.matonto.rdf.core.utils.Values;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.repository.*;
import org.openrdf.rio.*;
import java.io.*;
import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;

@Component(provide= CSVConverter.class)
public class CSVConverterImpl implements CSVConverter {

    private static final Logger LOGGER = Logger.getLogger(CSVConverterImpl.class);

    private ValueFactory valueFactory;
    private ModelFactory modelFactory;

    Map<IRI, ClassMapping> uriToObject;

    //Inject Import and Export Services
    RDFImportService importService;
    RDFExportService exportService;


    @Reference
    public void setImportService(RDFImportService importService){this.importService = importService;}

    @Reference
    public void setExportService(RDFExportService exportService){this.exportService = exportService;}

    @Reference
    public void setValueFactory(ValueFactory valueFactory){this.valueFactory = valueFactory;}

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }


    @Override
    public void importCSV(File csv, File mappingFile, String repoID) throws RDFParseException, IOException, RepositoryException {
        importCSV(csv, parseMapping(mappingFile), repoID);
    }


    @Override
    public void importCSV(File csv, Model mappingModel, String repoID) throws IOException, RepositoryException {
        Model converted = convert(csv, mappingModel);

        //Import Converted using rdf.importer
        importService.importModel(repoID, sesameModel(converted));
    }

    @Override
    public void exportCSV(File csv, File mappingFile, File exportFile) throws IOException{
        exportCSV(csv, parseMapping(mappingFile), exportFile);
    }

    @Override
    public void exportCSV(File csv, Model mappingModel, File exportFile) throws IOException{
        Model converted = convert(csv, mappingModel);

        exportService.exportToFile(sesameModel(converted), exportFile);
    }

    @Override
    public Model convert(File csv, File mappingFile) throws IOException, RDFParseException {
        Model converted = parseMapping(mappingFile);
        return convert(csv, converted);
    }

    /**
     * Generates a UUID for use in new RDF instances. Separate method allows for testing
     *
     * @return A String with a Universally Unique Identifier
     */
    public String generateUUID() {
        return UUID.randomUUID().toString();
    }

    /**
     * Pulls the documents delimiting character from the mapping. If no separator is found, a comma is used
     *
     * @param mappingModel The ontology mapping in an RDF Model. See MatOnto Wiki for details.
     * @return The character that is used to separate values in the document to be loaded.
     */
    public char getSeparator(Model mappingModel) {
        char separator;
        Model documentModel = mappingModel.filter(null, valueFactory.createIRI(Delimited.TYPE.stringValue()), valueFactory.createIRI(Delimited.DOCUMENT.stringValue()));
        if (documentModel.isEmpty())
            return ',';
        IRI documentIRI = (IRI) documentModel.subjects().toArray()[0];
        Model separatorModel = mappingModel.filter(documentIRI, valueFactory.createIRI(Delimited.SEPARATOR.stringValue()), null);
        if (separatorModel.isEmpty())
            return ',';
        else
            separator = Models.objectString(separatorModel).get().charAt(0);

        return separator;
    }


    @Override
    public Model convert(File csv, Model mappingModel) throws IOException {
        char separator = getSeparator(mappingModel);
        CSVReader reader = new CSVReader(new FileReader(csv), separator);
        String[] nextLine;

        Model convertedRDF = modelFactory.createModel();

        ArrayList<ClassMapping> classMappings = parseClassMappings(mappingModel);

        LOGGER.warn(classMappings);
        //Skip headers
        reader.readNext();
        //Traverse each row and convert column into RDF
        while ((nextLine = reader.readNext()) != null) {
            for (ClassMapping cm : classMappings) {
                convertedRDF.addAll(writeClassToModel(cm,nextLine));
            }
            //Reset classMappings
            for (ClassMapping cm : classMappings) {
                cm.setInstance(false);
            }
        }
        return convertedRDF;
    }

    /**
     * Writes RDF statements based on a class mapping and a line of data from CSV
     *
     * @param cm       The ClassMapping object to guide the RDF creation
     * @param nextLine The line of CSV to be mapped
     * @return A Model of RDF based on the line of CSV data
     */
    Model writeClassToModel(ClassMapping cm, String[] nextLine) {
        Model convertedRDF = modelFactory.createModel();
        //Generate new IRI if an instance of the class mapping has not been created in this row.
        if(!cm.isInstance()) {
            String classLocalName = generateLocalName(cm.getLocalName(), nextLine);
            cm.setIRI(valueFactory.createIRI(cm.getPrefix() + classLocalName));
            if(!"_".equals(classLocalName))
                cm.setInstance(true);
        }
        //If there isn't enough data to create the local name, don't create the instance
        if (!cm.isInstance())
            return convertedRDF;


        IRI classInstance = cm.getIri();
        convertedRDF.add(classInstance, valueFactory.createIRI(Delimited.TYPE.stringValue()), valueFactory.createIRI(cm.getMapping()));
        //Create the data properties
        Map<Integer, String> dataProps = cm.getDataProperties();
        for (Integer i : dataProps.keySet()) {
            IRI property = valueFactory.createIRI(dataProps.get(i));
            try {
                convertedRDF.add(classInstance, property, valueFactory.createLiteral("" + nextLine[i - 1]));
            } catch (ArrayIndexOutOfBoundsException e) {
                //Cell does not contain any data. No need to throw exception.
                LOGGER.info("Missing data for " + classInstance + ": " + property);
            }
        }

        //Create the object properties
        Map<ClassMapping, String> objectProps = cm.getObjectProperties();
        for (ClassMapping objectMapping : objectProps.keySet()) {
            if(!objectMapping.isInstance()) {
                String localName = generateLocalName(objectMapping.getLocalName(), nextLine);
                objectMapping.setIRI(valueFactory.createIRI(objectMapping.getPrefix() + localName));
                if(!"_".equals(localName))
                    objectMapping.setInstance(true);
            }

            //If there isn't enough data to create the local name, don't create the instance
            IRI property = valueFactory.createIRI(objectProps.get(objectMapping));
            if (objectMapping.isInstance())
                convertedRDF.add(classInstance, property, objectMapping.getIri());
        }

        return convertedRDF;
    }

    /**
     * Generates a local name for RDF Instances
     *
     * @param localNameTemplate The local name template given in the mapping file. See MatOnto Wiki for details
     * @param currentLine       The current line in the CSV file in case data is used in the Local Name
     * @return The local name portion of a IRI used in RDF data
     */
    String generateLocalName(String localNameTemplate, String[] currentLine) {
        String uuid = "";
        if ("".equals(localNameTemplate) || localNameTemplate == null) {
            //Only generate UUIDs when necessary. If you really have to waste a UUID go here: http://wasteaguid.info/
            uuid = generateUUID();
            return uuid;
        }
        Pattern p = Pattern.compile("(\\$\\{)(\\d+|UUID)(\\})");
        Matcher m = p.matcher(localNameTemplate);
        StringBuffer result = new StringBuffer();
        while (m.find()) {
            if ("UUID".equals(m.group(2)))
                //Once again, only generate UUIDs when necessary
                m.appendReplacement(result, generateUUID());
            else {
                int colIndex = Integer.parseInt(m.group(2));
                try {
                    m.appendReplacement(result, currentLine[colIndex - 1]);
                } catch (ArrayIndexOutOfBoundsException e) {
                    LOGGER.info("Data not available for local name. Using '_'");
                    m.appendReplacement(result, "_");
                }
            }
        }
        m.appendTail(result);
        return result.toString();
    }

    /**
     * Parse the data from the Mapping File into ClassMapping POJOs
     *
     * @param mappingModel The Mapping File used to parse CSV data in a Model
     * @return An ArrayList of ClassMapping Objects created from the mapping model.
     */
    private ArrayList<ClassMapping> parseClassMappings(Model mappingModel) {
        ArrayList<ClassMapping> classMappings = new ArrayList<ClassMapping>();

        Model classMappingModel = mappingModel.filter(null, valueFactory.createIRI(Delimited.TYPE.stringValue()), valueFactory.createIRI("http://matonto.org/ontologies/delimited/ClassMapping"));
        LOGGER.warn("ClassMappingModel empty?" + classMappingModel.isEmpty());
        LOGGER.warn("MappingModel empty?" + mappingModel.isEmpty());
        LOGGER.warn("MappingModel things:\n" + mappingModel.subjects());
        uriToObject = new LinkedHashMap<IRI, ClassMapping>();
        for (Resource classMappingIRI : classMappingModel.subjects()) {
            LOGGER.warn("Parsing mappings");
            ClassMapping classMapping;

            if (uriToObject.containsKey(classMappingIRI)) {
                classMapping = uriToObject.get(classMappingIRI);
            } else {
                classMapping = new ClassMapping();
                uriToObject.put((IRI) classMappingIRI, classMapping);
            }

            Model prefixModel = mappingModel.filter(classMappingIRI, valueFactory.createIRI(Delimited.HAS_PREFIX.stringValue()), null);

            //Parse each property
            if (!prefixModel.isEmpty())
                classMapping.setPrefix(Models.objectString(prefixModel).get());
            Model mapsToModel = mappingModel.filter(classMappingIRI, valueFactory.createIRI(Delimited.MAPS_TO.stringValue()), null);
            if (!mapsToModel.isEmpty())
                classMapping.setMapping(Models.objectString(mapsToModel).get());
            Model localNameModel = mappingModel.filter(classMappingIRI, valueFactory.createIRI(Delimited.LOCAL_NAME.stringValue()), null);
            if (!localNameModel.isEmpty())
                classMapping.setLocalName(Models.objectString(localNameModel).get());

            //Parse the data properties
            Model dataPropertyModel = mappingModel.filter(classMappingIRI, valueFactory.createIRI(Delimited.DATA_PROPERTY.stringValue()), null);
            for (Statement s : dataPropertyModel) {
                Model propertyModel = mappingModel.filter((IRI) s.getObject(), valueFactory.createIRI(Delimited.HAS_PROPERTY.stringValue()), null);
                String property = Models.objectString(propertyModel).get();
                Model indexModel = mappingModel.filter((IRI) s.getObject(), valueFactory.createIRI(Delimited.COLUMN_INDEX.stringValue()), null);
                Integer columnIndexInt = Integer.parseInt(Models.objectLiteral(indexModel).get().stringValue());
                classMapping.addDataProperty(columnIndexInt, property);
            }

            //Parse the object properties
            Model objectPropertyModel = mappingModel.filter(classMappingIRI, valueFactory.createIRI(Delimited.OBJECT_PROPERTY.stringValue()), null);
            for (Statement s : objectPropertyModel) {
                Model propertyModel = mappingModel.filter((IRI) s.getObject(), valueFactory.createIRI(Delimited.HAS_PROPERTY.stringValue()), null);
                String property = Models.objectString(propertyModel).get();
                Model classModel = mappingModel.filter((IRI) s.getObject(), valueFactory.createIRI(Delimited.CLASS_MAPPING_PROP.stringValue()), null);
                IRI objectMappingResultIRI = Models.objectIRI(classModel).get();

                if (uriToObject.containsKey(objectMappingResultIRI))
                    classMapping.addObjectProperty(uriToObject.get(objectMappingResultIRI), property);
                else {
                    ClassMapping objectMappingResult = new ClassMapping();
                    classMapping.addObjectProperty(objectMappingResult, property);
                    uriToObject.put(objectMappingResultIRI, objectMappingResult);
                }
            }
            classMappings.add(classMapping);
        }
        return classMappings;
    }

    /**
     * Parses a Mapping file into a Model
     *
     * @param mapping the mapping file to be parsed to a model
     * @return An RDF Model containing the data from the mapping file
     * @throws RDFParseException Thrown if there is a problem with RDF data in the file
     * @throws IOException       Thrown if there is a problem reading the file.
     */
    private Model parseMapping(File mapping) throws RDFParseException, IOException {
        String extension = mapping.getName().split("\\.")[mapping.getName().split("\\.").length - 1];
        LOGGER.info("FileName = " + mapping.getName() + "\t Extension:" + extension);
        RDFFormat mapFormat;
        if(extension.equals("jsonld"))
            mapFormat = RDFFormat.JSONLD;
        else
            mapFormat = Rio.getParserFormatForFileName(mapping.getName()).get();
        FileReader r = new FileReader(mapping);
        Model m;
        m = matontoModel(Rio.parse(r, "", mapFormat));

        return m;
    }

    org.openrdf.model.Model sesameModel(Model m){
        Set<org.openrdf.model.Statement> stmts = m.stream()
                                .map(Values::sesameStatement)
                                .collect(Collectors.toSet());

        org.openrdf.model.Model sesameModel = new LinkedHashModel();
        sesameModel.addAll(stmts);

        return sesameModel;
    }

    Model matontoModel(org.openrdf.model.Model m){
        Set<Statement> stmts = m.stream()
                .map(Values::matontoStatement)
                .collect(Collectors.toSet());

        Model matontoModel = modelFactory.createModel(stmts);

        return matontoModel;
    }
}
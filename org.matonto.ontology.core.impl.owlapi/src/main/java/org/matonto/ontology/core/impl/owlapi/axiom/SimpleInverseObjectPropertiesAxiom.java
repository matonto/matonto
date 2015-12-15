package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.InverseObjectPropertiesAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleInverseObjectPropertiesAxiom 
	extends SimpleAxiom 
	implements InverseObjectPropertiesAxiom {

	
	private ObjectPropertyExpression firstProperty;
	private ObjectPropertyExpression secondProperty;
	
	public SimpleInverseObjectPropertiesAxiom(ObjectPropertyExpression firstProperty, ObjectPropertyExpression secondProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.firstProperty = Preconditions.checkNotNull(firstProperty, "firstProperty cannot be null");
		this.secondProperty = Preconditions.checkNotNull(secondProperty, "secondProperty cannot be null");
	}

	
	@Override
	public InverseObjectPropertiesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleInverseObjectPropertiesAxiom(firstProperty, secondProperty, NO_ANNOTATIONS);
	}

	
	@Override
	public InverseObjectPropertiesAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleInverseObjectPropertiesAxiom(firstProperty, secondProperty, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.INVERSE_OBJECT_PROPERTIES;
	}

	
	@Override
	public ObjectPropertyExpression getFirstProperty() 
	{
		return firstProperty;
	}

	
	@Override
	public ObjectPropertyExpression getSecondProperty() 
	{
		return secondProperty;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof InverseObjectPropertiesAxiom) {
			InverseObjectPropertiesAxiom other = (InverseObjectPropertiesAxiom)obj;			 
			return  ((firstProperty.equals(other.getFirstProperty())) && (secondProperty.equals(other.getSecondProperty())));
		}
		
		return false;
	}

}

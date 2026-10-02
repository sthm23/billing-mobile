import {
  Button,
  ButtonText,
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  HStack,
  Input,
  InputField,
  Select,
  VStack
} from "@/components/base";
import { PaymentType } from "@/models/order.model";
import { CashTransactionCategory, CashTransactionType } from "@/models/payment.model";
import { CreateTransactionPayload } from "@/services/cashbox/cashbox.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const transactionSchema = z.object({
  category: z.nativeEnum(CashTransactionCategory, {
    message: "Category is required",
  }),
  paymentType: z.nativeEnum(PaymentType, {
    message: "Payment type is required",
  }),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  comment: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

type TransactionFormProps = {
  cashboxId: string;
  transactionType: CashTransactionType;
  onSubmit: (payload: CreateTransactionPayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export const TransactionForm = ({
  cashboxId,
  transactionType,
  onSubmit: onSubmitProp,
  onCancel,
  isLoading = false,
}: TransactionFormProps) => {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      category: CashTransactionCategory.OTHER,
      paymentType: PaymentType.CASH,
      amount: "",
      comment: "",
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    try {
      await onSubmitProp({
        cashboxId,
        type: transactionType,
        category: data.category,
        paymentType: data.paymentType,
        amount: Number(data.amount),
        comment: data.comment || "",
        orderId: null,
      });
    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  };

  const categoryOptions = Object.values(CashTransactionCategory);
  const paymentTypeOptions = Object.values(PaymentType);

  const isIncome = transactionType === CashTransactionType.INCOME;
  const formTitle = isIncome ? t('payment.addIncome') : t('payment.addExpense');

  return (
    <VStack className="gap-4">
      {/* Category Select */}
      <FormControl isInvalid={!!errors.category}>
        <FormControlLabel>
          <FormControlLabelText>{t('payment.category.name')}</FormControlLabelText>
        </FormControlLabel>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <Select
              variant="outline"
              size="md"
              selectedValue={value}
              onValueChange={onChange}
            >
              {categoryOptions.map((category) => (
                <Select.Item
                  key={category}
                  label={t(`payment.category.${category}`)}
                  value={category}
                />
              ))}
            </Select>
          )}
        />
        {errors.category && (
          <FormControlError>
            <FormControlErrorText>{errors.category.message}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Payment Type Select */}
      <FormControl isInvalid={!!errors.paymentType}>
        <FormControlLabel>
          <FormControlLabelText>{t('order.paymentMethod.name')}</FormControlLabelText>
        </FormControlLabel>
        <Controller
          control={control}
          name="paymentType"
          render={({ field: { onChange, value } }) => (
            <Select
              variant="outline"
              size="md"
              selectedValue={value}
              onValueChange={onChange}
            >
              {paymentTypeOptions.map((type) => (
                <Select.Item
                  key={type}
                  label={t(`order.paymentMethod.${type}`)}
                  value={type}
                />
              ))}
            </Select>
          )}
        />
        {errors.paymentType && (
          <FormControlError>
            <FormControlErrorText>{errors.paymentType.message}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Amount Input */}
      <FormControl isInvalid={!!errors.amount}>
        <FormControlLabel>
          <FormControlLabelText>{t('payment.amount')}</FormControlLabelText>
        </FormControlLabel>
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <Input variant="outline" size="md">
              <InputField
                placeholder="0"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
              />
            </Input>
          )}
        />
        {errors.amount && (
          <FormControlError>
            <FormControlErrorText>{errors.amount.message}</FormControlErrorText>
          </FormControlError>
        )}
      </FormControl>

      {/* Comment Input */}
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText>{t('payment.comment')}</FormControlLabelText>
        </FormControlLabel>
        <Controller
          control={control}
          name="comment"
          render={({ field: { onChange, value } }) => (
            <Input variant="outline" size="md">
              <InputField
                placeholder={t('payment.comment')}
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
              />
            </Input>
          )}
        />
      </FormControl>

      {/* Action Buttons */}
      <HStack className="gap-3 mt-4">
        <Button
          className="flex-1"
          variant="outline"
          onPress={onCancel}
          disabled={isLoading}
        >
          <ButtonText>{t('order.cancel')}</ButtonText>
        </Button>
        <Button
          className="flex-1"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          <ButtonText>
            {isLoading ? t('order.search') + '...' : t('payment.save')}
          </ButtonText>
        </Button>
      </HStack>
    </VStack>
  );
};
